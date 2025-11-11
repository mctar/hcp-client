// Human Client Protocol - Configuration
// Update this file with your ngrok URL when running live performances

const CONFIG = {
  // Development server (local)
  development: {
    server: 'localhost:7179',
    protocol: 'ws'
  },

  // Production server (ngrok tunnel)
  // Update this with your ngrok URL (without protocol prefix)
  // Example: 'abc123.ngrok.io'
  production: {
    server: 'YOUR_NGROK_URL_HERE',
    protocol: 'wss'
  },

  // Set to 'production' when using ngrok, 'development' for local testing
  mode: 'development'
};

// Helper function to get current server configuration
function getServerConfig() {
  return CONFIG[CONFIG.mode];
}

// Helper function to build full WebSocket URL
function getWebSocketURL(serverAddress) {
  // If server address is provided via URL parameter, use it directly
  if (serverAddress) {
    // Detect protocol based on URL or default to wss for secure connections
    if (serverAddress.startsWith('localhost') || serverAddress.startsWith('127.0.0.1')) {
      return `ws://${serverAddress}`;
    } else {
      return `wss://${serverAddress}`;
    }
  }

  // Otherwise use config
  const config = getServerConfig();
  return `${config.protocol}://${config.server}`;
}
