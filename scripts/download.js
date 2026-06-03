#!/usr/bin/env node
/**
 * Download YouTube transcript and convert to project format.
 *
 * Usage:
 *   node scripts/download.js VIDEO_ID
 *   node scripts/download.js VIDEO_ID "Custom Title"
 *
 * Example:
 *   node scripts/download.js V0FQ5-e1HLw
 *   node scripts/download.js V0FQ5-e1HLw "Nuevo amigo🛞 | Slow & clear Spanish podcast ep. 96"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { TRANSCRIPTS_DIR } = require('../src/config');
const TMP_DIR = '/tmp';

function checkSpanishSubtitles(videoId) {
    try {
        const output = execSync(
            `yt-dlp --list-subs "https://www.youtube.com/watch?v=${videoId}" 2>&1`,
            { encoding: 'utf-8', stdio: 'pipe', timeout: 30000 }
        );
        
        // Check if Spanish (es) appears in the subtitle list
        // Look for "es" as a language code in the output
        const lines = output.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('es ') || trimmed.startsWith('es\t')) {
                return true;
            }
        }
        
        return false;
    } catch (e) {
        console.error('Error checking subtitles:', e.message);
        return false;
    }
}

function downloadSubtitles(videoId) {
    console.log(`Downloading subtitles for ${videoId}...`);
    
    try {
        const output = execSync(
            `yt-dlp --skip-download --write-auto-subs --sub-langs es --sub-format srt --convert-subs srt "https://www.youtube.com/watch?v=${videoId}" -o "${TMP_DIR}/${videoId}"`,
            { encoding: 'utf-8', stdio: 'pipe', timeout: 60000 }
        );
        console.log('Download complete');
        return true;
    } catch (e) {
        console.error('Failed to download subtitles:', e.stderr || e.message);
        return false;
    }
}

function getVideoTitle(videoId) {
    try {
        const title = execSync(
            `yt-dlp --skip-download --print "%(title)s" "https://www.youtube.com/watch?v=${videoId}"`,
            { encoding: 'utf-8', stdio: 'pipe', timeout: 30000 }
        ).trim();
        return title;
    } catch (e) {
        console.warn('Could not fetch title');
        return 'Transcript';
    }
}

function parseSRT(content) {
    const lines = [];
    const pattern = /(\d+)\s*\n(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}\s*\n((?:[^\n]+\n?)+)/g;
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
        const hours = parseInt(match[2]);
        const mins = parseInt(match[3]);
        const secs = parseInt(match[4]);
        const ms = parseInt(match[5]);
        
        const startTime = hours * 3600 + mins * 60 + secs + ms / 1000;
        
        // Clean text: remove bracketed descriptions
        let text = match[6].trim().replace(/\n/g, ' ');
        text = text.replace(/\[[^\]]+\]/g, '');
        text = text.replace(/\s+/g, ' ').trim();
        
        if (text) {
            lines.push({ time: startTime, text });
        }
    }
    
    return lines;
}

function mergeLines(lines, maxLength = 120) {
    const merged = [];
    let currentText = '';
    let startTime = null;
    
    for (const { time, text } of lines) {
        if (startTime === null) {
            startTime = time;
            currentText = text;
        } else if (currentText.length + text.length + 1 < maxLength) {
            currentText += ' ' + text;
        } else {
            merged.push({ time: startTime, text: currentText });
            startTime = time;
            currentText = text;
        }
    }
    
    if (currentText) {
        merged.push({ time: startTime, text: currentText });
    }
    
    return merged;
}

function formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function convertToMarkdown(videoId, title) {
    const srtPath = path.join(TMP_DIR, `${videoId}.es.srt`);
    
    if (!fs.existsSync(srtPath)) {
        console.error(`SRT file not found: ${srtPath}`);
        return false;
    }
    
    const content = fs.readFileSync(srtPath, 'utf-8');
    const lines = parseSRT(content);
    const merged = mergeLines(lines);
    
    const outputPath = path.join(TRANSCRIPTS_DIR, `${videoId}.md`);
    
    let markdown = `---\ntitle: ${title}\nsource: https://www.youtube.com/watch?v=${videoId}\n---\n\n`;
    
    for (const { time, text } of merged) {
        markdown += `**${formatTimestamp(time)}** ${text}\n`;
    }
    
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`Created ${outputPath} with ${merged.length} lines`);
    
    // Cleanup temp file
    fs.unlinkSync(srtPath);
    
    return true;
}

function main() {
    const videoId = process.argv[2];
    const customTitle = process.argv[3];
    
    if (!videoId) {
        console.error('Usage: node scripts/download.js VIDEO_ID ["Title"]');
        process.exit(1);
    }
    
    // Ensure transcripts directory exists
    if (!fs.existsSync(TRANSCRIPTS_DIR)) {
        fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
    }
    
    // Check if already exists
    const outputPath = path.join(TRANSCRIPTS_DIR, `${videoId}.md`);
    if (fs.existsSync(outputPath) && !process.argv.includes('--force')) {
        console.log(`Transcript already exists: ${outputPath}`);
        console.log('Use --force to overwrite');
        process.exit(0);
    }
    
    // Check if Spanish subtitles are available
    console.log(`Checking Spanish subtitles for ${videoId}...`);
    if (!checkSpanishSubtitles(videoId)) {
        console.error(`\nError: No Spanish subtitles available for video ${videoId}`);
        console.error('Please download the transcript manually.\n');
        process.exit(1);
    }
    
    // Download
    if (!downloadSubtitles(videoId)) {
        process.exit(1);
    }
    
    // Get title
    const title = customTitle || getVideoTitle(videoId);
    
    // Convert
    if (!convertToMarkdown(videoId, title)) {
        process.exit(1);
    }
    
    console.log('Done!');
}

main();
