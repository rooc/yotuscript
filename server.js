/**
 * Application entry point.
 *
 * Bootstraps the HTTP server on PORT (default 9090).
 *
 * Usage:
 *   node server.js          → start the web server
 */
const http = require('http');
const fs = require('fs');
const { PORT, TRANSCRIPTS_DIR, VOCAB_DIR } = require('./src/config');
const { setupRoutes } = require('./src/routes');

// Ensure required directories exist at startup
if (!fs.existsSync(TRANSCRIPTS_DIR)) {
    fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
}
if (!fs.existsSync(VOCAB_DIR)) {
    fs.mkdirSync(VOCAB_DIR, { recursive: true });
}

// === HTTP SERVER ===
const server = http.createServer(setupRoutes);

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Transcripts folder: ${TRANSCRIPTS_DIR}`);
});
