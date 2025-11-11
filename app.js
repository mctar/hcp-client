// Human Client Protocol - Client Application
let ws = null;
let serverAddress = null;
let clientId = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Get server address from URL parameter
function getServerAddress() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('server');
}

// Show a specific screen
function showScreen(screenId) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  // Show requested screen
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
  }
}

// Start the client
function startClient() {
  serverAddress = getServerAddress();

  if (!serverAddress) {
    showError('No server address provided. Please scan the QR code again.');
    return;
  }

  // Show server info
  document.getElementById('serverInfo').textContent = `Server: ${serverAddress}`;

  // Show connecting screen
  showScreen('connecting');

  // Connect to WebSocket server
  connectToServer();
}

// Connect to WebSocket server
function connectToServer() {
  try {
    // Construct WebSocket URL with proper protocol support
    const wsUrl = getWebSocketURL(serverAddress);

    document.getElementById('connectStatus').textContent = 'Establishing connection...';

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to HCP server');
      reconnectAttempts = 0;
      document.getElementById('connectStatus').textContent = 'Connected! Initializing...';
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
      showError('Connection error. Please check your network and try again.');
    };

    ws.onclose = () => {
      console.log('Disconnected from server');

      // Attempt to reconnect if not on error screen
      if (document.getElementById('error').classList.contains('active')) {
        return;
      }

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

        setTimeout(() => {
          showScreen('connecting');
          document.getElementById('connectStatus').textContent = `Reconnecting... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`;
          connectToServer();
        }, 2000);
      } else {
        showError('Lost connection to server. Please refresh to try again.');
      }
    };

  } catch (error) {
    console.error('Error connecting to server:', error);
    showError('Failed to connect to server. Please try again.');
  }
}

// Handle messages from server
function handleServerMessage(data) {
  console.log('Received message:', data);

  switch (data.type) {
    case 'connected':
      // Store client ID
      clientId = data.clientId;
      document.getElementById('clientIdDisplay').textContent = `ID: ${clientId}`;

      // Send ready signal
      sendMessage({ type: 'ready' });

      // Show idle screen
      showScreen('idle');
      break;

    case 'instruction':
      // Display instruction
      displayInstruction(data.instruction, data.timestamp);
      break;

    case 'acknowledged':
      // Task completion acknowledged
      showScreen('completing');

      // Return to idle after 2 seconds
      setTimeout(() => {
        showScreen('idle');
      }, 2000);
      break;

    case 'heartbeat_ack':
      // Heartbeat acknowledged
      break;

    default:
      console.log('Unknown message type:', data.type);
  }
}

// Display instruction to user
function displayInstruction(instruction, timestamp) {
  document.getElementById('instructionText').textContent = instruction;

  if (timestamp) {
    const date = new Date(timestamp);
    document.getElementById('timestamp').textContent = date.toLocaleTimeString();
  }

  showScreen('instruction');
}

// User completes task
function completeTask() {
  const btn = document.getElementById('completeBtn');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  sendMessage({ type: 'task_completed' });

  // Re-enable button after 2 seconds
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = '✓ Task Completed';
  }, 2000);
}

// Send message to server
function sendMessage(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  } else {
    console.error('WebSocket is not connected');
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
}, 30000); // Every 30 seconds

// Prevent screen from sleeping on mobile
let wakeLock = null;

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Screen wake lock acquired');

      wakeLock.addEventListener('release', () => {
        console.log('Screen wake lock released');
      });
    } catch (err) {
      console.log('Wake lock error:', err);
    }
  }
}

// Request wake lock when user starts
document.getElementById('startBtn').addEventListener('click', () => {
  requestWakeLock();
});

// Re-request wake lock when page becomes visible again
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !wakeLock) {
    requestWakeLock();
  }
});

// Check for server parameter on load
window.addEventListener('DOMContentLoaded', () => {
  const serverParam = getServerAddress();

  if (!serverParam) {
    // Show error on onboarding screen
    const startBtn = document.getElementById('startBtn');
    startBtn.disabled = true;
    startBtn.textContent = 'No Server Address';

    const content = document.querySelector('#onboarding .content');
    const errorBox = document.createElement('div');
    errorBox.className = 'info-box';
    errorBox.style.background = '#fee2e2';
    errorBox.style.borderLeft = '4px solid #dc2626';
    errorBox.innerHTML = '<p style="color: #dc2626; margin: 0;"><strong>Error:</strong> No server address in URL. Please scan a valid QR code.</p>';

    content.insertBefore(errorBox, startBtn);
  }
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
