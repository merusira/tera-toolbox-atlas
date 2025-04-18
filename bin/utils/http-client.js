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

// Cleanup function to be called during application shutdown
function cleanupConnections() {
    httpAgent.destroy();
    httpsAgent.destroy();
    console.log('HTTP/HTTPS connections cleaned up');
}

// Wrapper around fetch that uses our connection pooling agents
async function fetchWithPooling(url, options = {}) {
    const parsedUrl = new URL(url);
    const agent = parsedUrl.protocol === 'https:' ? httpsAgent : httpAgent;
    
    // Add listener cleanup to prevent memory leaks
    agent.on('free', (socket) => {
        // Remove excess listeners when socket is freed
        if (socket.listenerCount('close') > 1) {
            const listeners = socket.listeners('close');
            for (let i = 1; i < listeners.length; i++) {
                socket.removeListener('close', listeners[i]);
            }
        }
    });
    
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