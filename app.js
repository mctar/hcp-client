// HCP Performance Client - Simplified for Stage Performance
let ws = null;
let serverAddress = null;
let clientId = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
let wakeLock = null;

// Get server address from URL parameter or config
function getServerAddress() {
  const urlParams = new URLSearchParams(window.location.search);
  const serverParam = urlParams.get('server');

  if (serverParam) {
    return serverParam;
  }

  // Use config if available
  if (typeof getServerConfig === 'function') {
    const config = getServerConfig();
    return config.server;
  }

  if (!window.location.hostname.includes('github.io') && !window.location.hostname.includes('humancontrolprotocol.com')) {
    return window.location.host;
  }

  return null;
}

// Show a specific screen
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
  }
}

// Connect to WebSocket server
function connectToServer() {
  serverAddress = getServerAddress();

  if (!serverAddress) {
    showError('No server address provided');
    return;
  }

  try {
    // Use the config helper if available, otherwise build URL manually
    let wsUrl;
    if (typeof getWebSocketURL === 'function') {
      wsUrl = getWebSocketURL(serverAddress);
    } else {
      // Auto-detect protocol
      if (serverAddress.startsWith('localhost') || serverAddress.startsWith('127.0.0.1')) {
        wsUrl = `ws://${serverAddress}`;
      } else {
        wsUrl = `wss://${serverAddress}`;
      }
    }

    console.log('Connecting to:', wsUrl);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to server');
      reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from server');

      // Attempt to reconnect
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

        setTimeout(() => {
          showScreen('connecting');
          connectToServer();
        }, 2000);
      } else {
        showError('Lost connection to server');
      }
    };

  } catch (error) {
    console.error('Error connecting:', error);
    showError('Connection failed');
  }
}

// Handle messages from server
function handleServerMessage(data) {
  console.log('Received:', data);

  switch (data.type) {
    case 'connected':
      clientId = data.clientId;
      // Send ready signal
      sendMessage({ type: 'ready' });
      // Show idle screen
      showScreen('idle');
      break;

    case 'instruction':
      // Display instruction
      displayInstruction(data.instruction);
      break;

    case 'acknowledged':
      // Return to idle immediately
      showScreen('idle');
      break;

    case 'heartbeat_ack':
      // Heartbeat acknowledged
      break;

    default:
      console.log('Unknown message type:', data.type);
  }
}

// Display instruction to user
function displayInstruction(instruction) {
  document.getElementById('instructionText').textContent = instruction;
  showScreen('instruction');
}

// User completes task
function completeTask() {
  const btn = document.getElementById('doneBtn');
  btn.disabled = true;

  sendMessage({ type: 'task_completed' });

  setTimeout(() => {
    btn.disabled = false;
  }, 1000);
}

// Send message to server
function sendMessage(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  } else {
    console.error('WebSocket not connected');
  }
}

// Show error screen
function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  showScreen('error');
}

// Heartbeat to keep connection alive
setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    sendMessage({ type: 'heartbeat' });
  }
}, 30000);

// Request wake lock to prevent screen sleep
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake lock acquired');

      wakeLock.addEventListener('release', () => {
        console.log('Wake lock released');
      });
    } catch (err) {
      console.log('Wake lock error:', err);
    }
  }
}

// Re-request wake lock when page becomes visible
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && !wakeLock) {
    await requestWakeLock();
  }
});

// Auto-connect on page load
window.addEventListener('DOMContentLoaded', async () => {
  // Request wake lock
  await requestWakeLock();

  // Start connecting
  setTimeout(() => {
    connectToServer();
  }, 500);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (ws) {
    ws.close();
  }
  if (wakeLock) {
    wakeLock.release();
  }
});
