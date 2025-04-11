// Fixes the "MaxListenersExceededWarning" error that occurs with node-fetch
// by increasing the maximum number of listeners for TLSSocket objects.
// Later, the real solution to the underlying problem would be to properly clean up listeners when they're no longer needed,
// require modifying the node-fetch library itself.

module.exports = function TLSSocketMaxListenersFix(mod) {
    // Increase the maximum number of listeners for TLSSocket objects
    const tls = require('tls');
    if (tls.TLSSocket) {
        // Set a higher limit for TLSSocket listeners (default is 10)
        tls.TLSSocket.prototype.setMaxListeners(20);
        mod.log('TLSSocket MaxListeners limit increased to 20');
    }
}