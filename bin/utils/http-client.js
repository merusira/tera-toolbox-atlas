// Custom HTTP client with proper connection pooling and cleanup
const http = require('http');
const https = require('https');
const fetch = require('node-fetch');

// Create agents with connection pooling
const httpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 25,
    timeout: 60000
});

const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 25,
    timeout: 60000,
    rejectUnauthorized: false // temporary fix for Let's Encrypt certificate issues (from original code)
});

// Set higher maxListeners to prevent warnings
httpAgent.setMaxListeners(25);
httpsAgent.setMaxListeners(25);

// Cleanup function to be called during application shutdown
function cleanupConnections() {
    httpAgent.destroy();
    httpsAgent.destroy();
    console.log('HTTP/HTTPS connections cleaned up');
}

// Store a single listener reference to avoid adding multiple listeners
const socketCleanupListener = (socket) => {
    // Remove excess listeners when socket is freed
    if (socket.listenerCount('close') > 1) {
        const listeners = socket.listeners('close');
        for (let i = 1; i < listeners.length; i++) {
            socket.removeListener('close', listeners[i]);
        }
    }
};

// Add the listener only once to each agent
httpAgent.on('free', socketCleanupListener);
httpsAgent.on('free', socketCleanupListener);

// Wrapper around fetch that uses our connection pooling agents
async function fetchWithPooling(url, options = {}) {
    const parsedUrl = new URL(url);
    const agent = parsedUrl.protocol === 'https:' ? httpsAgent : httpAgent;
    
    // Merge options with our agent
    const fetchOptions = {
        ...options,
        agent
    };
    
    return fetch(url, fetchOptions);
}

module.exports = {
    fetchWithPooling,
    cleanupConnections,
    httpAgent,
    httpsAgent
};