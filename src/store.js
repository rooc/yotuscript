/**
 * Data-access layer ("store").
 *
 * Handles all filesystem I/O for transcripts and vocab files, plus parsing
 * between the internal markdown format and the XML payload the frontend expects.
 *
 * Transcript line format (markdown):
 *   **M:SS** Some text here
 *
 * Internal representation:
 *   { start: number, dur: number, text: string }
 */
const path = require('path');
const fs = require('fs');
const { TRANSCRIPTS_DIR, VOCAB_DIR, GRAMMAR_DIR, SUMMARY_DIR } = require('./config');

/**
 * Parse a transcript file into timed lines.
 *
 * Supports multiple timestamp formats:
 *   **H:MM:SS** Text  (or **MM:SS** Text) - markdown bold
 *   [MM:SS] Text                           - bracket timestamps
 *   (MM:SS) Text                           - parenthesised timestamps (browser extensions)
 *   SRT format: HH:MM:SS,mmm --> HH:MM:SS,mmm with sequential numbers
 *
 * @param {string} content  — raw file content
 * @param {string} filename — used to decide parser based on extension
 * @returns {{ start: number, dur: number, text: string }[]}
 */
function parseTranscriptFile(content, filename) {
    const ext = path.extname(filename).toLowerCase();
    const lines = [];

    if (ext === '.md' || ext === '.txt' || ext === '.srt') {
        // Remove YAML frontmatter if present
        const contentWithoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');

        // Try SRT format first: sequential number, timestamp line, text
        // Pattern: number\nHH:MM:SS,mmm --> HH:MM:SS,mmm\ntext
        // Handles optional blank lines between entries and multi-line text
        const srtRegex = /(\d+)[ \t]*\r?\n(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})[ \t]*\r?\n((?:[^\r\n]+(?:\r?\n(?![ \t]*\d+\r?\n\d{2}:\d{2}:\d{2},\d{3})[^\r\n]+)*)*)/g;
        let match;
        while ((match = srtRegex.exec(contentWithoutFrontmatter)) !== null) {
            const hours = parseInt(match[2]);
            const mins = parseInt(match[3]);
            const secs = parseInt(match[4]);
            const ms = parseInt(match[5]);
            const endHours = parseInt(match[6]);
            const endMins = parseInt(match[7]);
            const endSecs = parseInt(match[8]);
            const endMs = parseInt(match[9]);

            const startTime = hours * 3600 + mins * 60 + secs + ms / 1000;
            const endTime = endHours * 3600 + endMins * 60 + endSecs + endMs / 1000;
            const duration = endTime - startTime;
            const text = match[10].trim().replace(/\n+/g, ' ');

            lines.push({ start: startTime, dur: duration, text: text });
        }

        // Primary format: **H:MM:SS.mmm** Text or **MM:SS.mmm** Text (· separator optional)
        if (lines.length === 0) {
            const regex = /\*\*(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d{3}))?\*\*\s*(?:[·•]\s*)?(.+)/g;
            while ((match = regex.exec(content)) !== null) {
                const first = parseInt(match[1]);
                const second = parseInt(match[2]);
                const third = match[3] ? parseInt(match[3]) : null;
                const millis = match[4] ? parseInt(match[4]) : 0;

                let time;
                if (third !== null) {
                    // H:MM:SS[.mmm]
                    time = first * 3600 + second * 60 + third;
                } else {
                    // M:SS[.mmm]
                    time = first * 60 + second;
                }
                if (millis > 0) {
                    time += millis / 1000;
                }

                lines.push({ start: time, dur: 3, text: match[5].trim() });
            }
        }

        // Fallback format: [MM:SS.mmm] Text
        if (lines.length === 0) {
            const regex2 = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d{3}))?\]\s*(.+)/g;
            while ((match = regex2.exec(content)) !== null) {
                const first = parseInt(match[1]);
                const second = parseInt(match[2]);
                const third = match[3] ? parseInt(match[3]) : null;
                const millis = match[4] ? parseInt(match[4]) : 0;

                let time;
                if (third !== null) {
                    time = first * 3600 + second * 60 + third;
                } else {
                    time = first * 60 + second;
                }
                if (millis > 0) {
                    time += millis / 1000;
                }

                lines.push({ start: time, dur: 3, text: match[5].trim() });
            }
        }

        // Fallback format: (MM:SS.mmm) Text — as pasted from browser extensions.
        // Anchored to line start so parentheses inside the text are not matched.
        if (lines.length === 0) {
            const regex3 = /^\((\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d{3}))?\)[ \t]*(\S.*)$/gm;
            while ((match = regex3.exec(contentWithoutFrontmatter)) !== null) {
                const first = parseInt(match[1]);
                const second = parseInt(match[2]);
                const third = match[3] ? parseInt(match[3]) : null;
                const millis = match[4] ? parseInt(match[4]) : 0;

                let time;
                if (third !== null) {
                    time = first * 3600 + second * 60 + third;
                } else {
                    time = first * 60 + second;
                }
                if (millis > 0) {
                    time += millis / 1000;
                }

                lines.push({ start: time, dur: 3, text: match[5].trim() });
            }
        }
    }

    return lines;
}

/**
 * Extract an 11-character YouTube video ID from file content.
 *
 * Looks for the first `source:` URL in YAML frontmatter.
 *
 * @param {string} content
 * @returns {string | null}
 */
function getVideoIdFromFile(content) {
    // Standard watch URL
    const urlMatch = content.match(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (urlMatch) return urlMatch[1];
    // Shorts URL
    const shortsMatch = content.match(/https:\/\/www\.youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    return null;
}

/**
 * Convert the internal transcript array into the XML format the frontend uses.
 *
 * @param {{ start: number, dur?: number, text: string }[]} transcriptData
 * @returns {string}
 */
function convertToXML(transcriptData) {
    return `<?xml version="1.0" encoding="utf-8" ?><transcript>` +
        transcriptData.map(t =>
            `<text start="${t.start}" dur="${t.dur || 3}">${escapeXML(t.text)}</text>`
        ).join('') + '</transcript>';
}

/**
 * Escape characters that are not legal as XML character data.
 *
 * Transcript text is interpolated straight into the document, so a single
 * bare '&' (as in "m&m") makes the whole feed unparseable for the browser —
 * which fails the transcript fetch and leaves the page with no player at all.
 * '&' must be replaced first, or the ampersands of the other entities get
 * escaped a second time.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeXML(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Find and parse a transcript (original or translation) for a given video ID.
 *
 * Searches by either the filename prefix or the `source:` URL inside the file.
 *
 * @param {string} videoId
 * @param {'transcript' | 'translation'} [type='transcript']
 * @returns {{ start: number, dur: number, text: string }[] | null}
 */
function getTranscriptForVideo(videoId, type = 'transcript') {
    if (!fs.existsSync(TRANSCRIPTS_DIR)) return null;

    const files = fs.readdirSync(TRANSCRIPTS_DIR);
    for (const file of files) {
        const content = fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf-8');
        const fileVideoId = getVideoIdFromFile(content) || file;
        const isMatchingVideo = file.startsWith(videoId) || fileVideoId === videoId;
        const isTranslation = file.includes('translation') || file.includes('translate');

        if (isMatchingVideo) {
            if ((type === 'translation' && isTranslation) || (type === 'transcript' && !isTranslation)) {
                const parsed = parseTranscriptFile(content, file);
                if (parsed.length > 0) return parsed;
            }
        }
    }
    return null;
}

/**
 * Read the vocabulary JSON for a video.
 *
 * @param {string} videoId
 * @returns {Object.<string, string> | null}
 */
function readVocab(videoId) {
    const vocabPath = path.join(VOCAB_DIR, `${videoId}_vocab.json`);
    if (!fs.existsSync(vocabPath)) return null;
    return JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
}

/**
 * Read the grammar sentences JSON for a video.
 *
 * @param {string} videoId
 * @returns {Array.<{spanish: string, english: string, explanation: string}> | null}
 */
function readGrammar(videoId) {
    const grammarPath = path.join(GRAMMAR_DIR, `${videoId}_grammar.json`);
    if (!fs.existsSync(grammarPath)) return null;
    return JSON.parse(fs.readFileSync(grammarPath, 'utf-8'));
}

/**
 * Read the summary JSON for a video.
 *
 * @param {string} videoId
 * @returns {{summary: string} | null}
 */
function readSummary(videoId) {
    const summaryPath = path.join(SUMMARY_DIR, `${videoId}_summary.json`);
    if (!fs.existsSync(summaryPath)) return null;
    return JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
}

/**
 * Merge short transcript lines into longer segments (80-120 characters).
 *
 * @param {{ start: number, dur: number, text: string }[]} lines - Parsed transcript lines
 * @param {number} minLength - Minimum target length per merged segment (default: 80)
 * @param {number} maxLength - Maximum target length per merged segment (default: 120)
 * @returns {{ start: number, dur: number, text: string }[]} Merged segments
 */
function mergeTranscriptLines(lines, minLength = 80, maxLength = 120) {
    if (lines.length === 0) return [];
    
    const merged = [];
    let current = { ...lines[0] };
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const combinedText = current.text + ' ' + line.text;
        const combinedLength = combinedText.length;
        
        if (combinedLength <= maxLength) {
            // Can merge - add to current segment
            current.text = combinedText;
            current.dur = (line.start + line.dur) - current.start;
        } else if (current.text.length < minLength) {
            // Current is too short, merge anyway (but don't exceed maxLength too much)
            if (combinedLength <= maxLength + 20) {
                current.text = combinedText;
                current.dur = (line.start + line.dur) - current.start;
            } else {
                // Would exceed max by too much, start new segment
                merged.push(current);
                current = { ...line };
            }
        } else {
            // Current is good length, start new segment
            merged.push(current);
            current = { ...line };
        }
    }
    
    // Don't forget the last segment
    merged.push(current);
    
    return merged;
}

/**
 * Format seconds as MM:SS[.mmm] or H:MM:SS[.mmm] timestamp.
 * Preserves milliseconds when present in the input.
 *
 * @param {number} seconds - Time in seconds (may include fractional milliseconds)
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    
    if (hours > 0) {
        if (ms > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
        }
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    if (ms > 0) {
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert transcript segments to markdown format with **MM:SS** timestamps.
 *
 * @param {{ start: number, dur: number, text: string }[]} lines - Transcript lines
 * @param {string} frontmatter - Optional YAML frontmatter to preserve
 * @returns {string} Markdown formatted transcript
 */
function convertToMarkdown(lines, frontmatter = '') {
    const content = lines.map(line => {
        const timestamp = formatTimestamp(line.start);
        return `**${timestamp}** ${line.text}`;
    }).join('\n');
    
    if (frontmatter) {
        return frontmatter + '\n' + content;
    }
    return content;
}

/**
 * Extract YAML frontmatter from content if present.
 *
 * @param {string} content - File content
 * @returns {{ frontmatter: string, body: string }} Frontmatter and body
 */
function extractFrontmatter(content) {
    const match = content.match(/^(---\s*\n[\s\S]*?\n---\s*\n)([\s\S]*)$/);
    if (match) {
        return { frontmatter: match[1].trim(), body: match[2] };
    }
    return { frontmatter: '', body: content };
}

module.exports = {
    parseTranscriptFile,
    getVideoIdFromFile,
    convertToXML,
    getTranscriptForVideo,
    readVocab,
    readGrammar,
    readSummary,
    mergeTranscriptLines,
    convertToMarkdown,
    extractFrontmatter,
    formatTimestamp,
};
