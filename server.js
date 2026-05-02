const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const TRANSCRIPTS_DIR = path.join(__dirname, 'transcripts');

// Ensure transcripts directory exists
if (!fs.existsSync(TRANSCRIPTS_DIR)) {
    fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
}

function parseTranscriptFile(content, filename) {
    const ext = path.extname(filename).toLowerCase();
    const lines = [];
    
    // Try to extract video ID from frontmatter
    const urlMatch = content.match(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    const videoIdFromUrl = urlMatch ? urlMatch[1] : null;
    
    if (ext === '.md' || ext === '.txt') {
        // Parse format like: **0:00** · Text or **0:00:00** · Text
        // Format is M:SS or MM:SS or H:MM:SS
        const regex = /\*\*(\d{1,2}):(\d{2})(?::(\d{2}))?\*\*\s*[·•]\s*(.+)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            const first = parseInt(match[1]);
            const second = parseInt(match[2]);
            const third = match[3] ? parseInt(match[3]) : null;
            
            let time;
            if (third !== null) {
                // H:MM:SS format
                time = first * 3600 + second * 60 + third;
            } else {
                // M:SS format
                time = first * 60 + second;
            }
            
            lines.push({ start: time, dur: 3, text: match[4].trim() });
        }
        
        // Also try format: [00:00] Text
        if (lines.length === 0) {
            const regex2 = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]\s*(.+)/g;
            while ((match = regex2.exec(content)) !== null) {
                const first = parseInt(match[1]);
                const second = parseInt(match[2]);
                const third = match[3] ? parseInt(match[3]) : null;
                
                let time;
                if (third !== null) {
                    time = first * 3600 + second * 60 + third;
                } else {
                    time = first * 60 + second;
                }
                
                lines.push({ start: time, dur: 3, text: match[4].trim() });
            }
        }
    }
    
    return lines;
}

function getTranscriptForVideo(videoId, type = 'transcript') {
    if (!fs.existsSync(TRANSCRIPTS_DIR)) return null;
    
    const files = fs.readdirSync(TRANSCRIPTS_DIR);
    for (const file of files) {
        // Check if file matches videoId and type
        const fileVideoId = getVideoIdFromFile(fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf-8'));
        const isMatchingVideo = file.startsWith(videoId) || fileVideoId === videoId;
        
        if (isMatchingVideo) {
            const isTranslation = file.includes('translation') || file.includes('translate');
            if ((type === 'translation' && isTranslation) || (type === 'transcript' && !isTranslation)) {
                const content = fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf-8');
                const parsed = parseTranscriptFile(content, file);
                if (parsed.length > 0) return parsed;
            }
        }
    }
    return null;
}

function extractVideoId(filename) {
    // Try to extract 11-char YouTube video ID from filename
    const match = filename.match(/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : filename;
}

function getVideoIdFromFile(content) {
    // Try to extract from frontmatter URL
    const urlMatch = content.match(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (urlMatch) return urlMatch[1];
    return null;
}

function convertToXML(transcriptData) {
    return `<?xml version="1.0" encoding="utf-8" ?><transcript>` +
        transcriptData.map(t => 
            `<text start="${t.start}" dur="${t.dur || 3}">${t.text}</text>`
        ).join('') + '</transcript>';
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Translation endpoint
    if (url.pathname === '/api/translation') {
        const videoId = url.searchParams.get('v');
        
        if (!videoId) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Video ID required' }));
            return;
        }
        
        const translation = getTranscriptForVideo(videoId, 'translation');
        if (translation) {
            res.writeHead(200, { 'Content-Type': 'application/xml' });
            res.end(convertToXML(translation));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'No translation available' }));
        }
        return;
    }
    
    // Transcript endpoint
    if (url.pathname === '/api/transcript') {
        const videoId = url.searchParams.get('v');
        
        if (!videoId) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Video ID required' }));
            return;
        }
        
        // First check local transcripts folder
        const localTranscript = getTranscriptForVideo(videoId);
        if (localTranscript) {
            res.writeHead(200, { 'Content-Type': 'application/xml' });
            res.end(convertToXML(localTranscript));
            return;
        }
        
        // Try to fetch from YouTube
        const ytUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`;
        
        https.get(ytUrl, (ytRes) => {
            let data = '';
            ytRes.on('data', chunk => data += chunk);
            ytRes.on('end', () => {
                if (ytRes.statusCode === 200 && data.length > 100 && data.includes('<text')) {
                    res.writeHead(200, { 'Content-Type': 'application/xml' });
                    res.end(data);
                } else {
                    // Try without language
                    const ytUrl2 = `https://www.youtube.com/api/timedtext?v=${videoId}`;
                    https.get(ytUrl2, (ytRes2) => {
                        let data2 = '';
                        ytRes2.on('data', chunk => data2 += chunk);
                        ytRes2.on('end', () => {
                            if (ytRes2.statusCode === 200 && data2.length > 100 && data2.includes('<text')) {
                                res.writeHead(200, { 'Content-Type': 'application/xml' });
                                res.end(data2);
                            } else {
                                res.writeHead(404);
                                res.end(JSON.stringify({ error: 'No transcript available' }));
                            }
                        });
                    }).on('error', (e) => {
                        res.writeHead(500);
                        res.end(JSON.stringify({ error: e.message }));
                    });
                }
            });
        }).on('error', (e) => {
            res.writeHead(500);
            res.end(JSON.stringify({ error: e.message }));
        });
        return;
    }
    
    // List available transcripts
    if (url.pathname === '/api/transcripts') {
        const files = fs.existsSync(TRANSCRIPTS_DIR) ? fs.readdirSync(TRANSCRIPTS_DIR) : [];
        const grouped = {};
        
        files.forEach(f => {
            const content = fs.readFileSync(path.join(TRANSCRIPTS_DIR, f), 'utf-8');
            const parsed = parseTranscriptFile(content, f);
            const videoId = getVideoIdFromFile(content) || extractVideoId(f);
            const isTranslation = f.includes('translation') || f.includes('translate');
            
            // Extract title from frontmatter
            const titleMatch = content.match(/title:\s*["'](.+?)["']/);
            const fullTitle = titleMatch ? titleMatch[1] : null;
            // Short title (3 words) for sidebar tags
            let shortTitle = fullTitle;
            if (fullTitle) {
                const words = fullTitle.split(/\s+/);
                shortTitle = words.slice(0, 3).join(' ');
            }
            
            if (!grouped[videoId]) {
                grouped[videoId] = { videoId, title: shortTitle, fullTitle: fullTitle || shortTitle, lines: 0, hasTranslation: false };
            }
            
            if (parsed.length > 0) {
                if (isTranslation) {
                    grouped[videoId].hasTranslation = true;
                } else {
                    grouped[videoId].lines = parsed.length;
                    // Use title from transcript file if not already set
                    if (!grouped[videoId].title && shortTitle) {
                        grouped[videoId].title = shortTitle;
                        grouped[videoId].fullTitle = fullTitle || shortTitle;
                    }
                }
            }
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(Object.values(grouped)));
        return;
    }
    
    // Serve static files
    let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end(err.message);
            }
        } else {
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json'
            };
            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Transcripts folder: ${TRANSCRIPTS_DIR}`);
});
