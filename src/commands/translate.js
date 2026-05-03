/**
 * Translate command — cleans transcripts and generates missing artefacts.
 *
 * Run with:
 *   node server.js translate
 *
 * Performs three steps for every original transcript:
 *   1. Clean markdown (strip headings, section dividers, blank lines)
 *   2. Create missing `_translation.md` placeholder files
 *   3. Create missing `_vocab.json` files (B1+ Spanish words only) with auto-translations
 */
const path = require('path');
const fs = require('fs');
const { TRANSCRIPTS_DIR, VOCAB_DIR } = require('../config');
const { findTranscriptFiles, readTranscript, writeTranscript, writeVocab } = require('../store');
const { loadExcludedWords } = require('../exclusions');
const { detectVerbForm } = require('../grammar');
const { translateWords } = require('../translator');

/**
 * Execute the translate pipeline and print a report to stdout.
 */
async function runTranslate() {
    console.log('\n=== TRANSLATE: Processing transcripts ===\n');

    /** @type {string[]} */
    const cleanedFiles = [];
    /** @type {string[]} */
    const translationsCreated = [];
    /** @type {string[]} */
    const vocabCreated = [];

    const transcriptFiles = findTranscriptFiles();

    for (const filename of transcriptFiles) {
        let content = readTranscript(filename);
        if (!content) continue;

        // --- Step 1: Clean the file ---
        const originalContent = content;

        // Remove markdown headings (# Heading)
        content = content.replace(/^#+\s+.+$/gm, '');

        // Remove section dividers (---, ===) but preserve YAML frontmatter
        const lines = content.split('\n');
        let inFrontmatter = false;
        let frontmatterEnded = false;
        const cleanedLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Toggle frontmatter state on the first two `---` lines
            if (line.trim() === '---' && !frontmatterEnded) {
                inFrontmatter = !inFrontmatter;
                if (!inFrontmatter) frontmatterEnded = true;
                cleanedLines.push(line);
                continue;
            }

            // Skip secondary headings like "## Transcript"
            if (/^##?\s+\w+/i.test(line)) continue;
            // Skip horizontal rules
            if (/^[-=]{3,}$/.test(line.trim())) continue;

            // Keep timestamp lines and any non-empty line
            if (/\*\*\d{1,2}:\d{2}/.test(line) || line.trim()) {
                cleanedLines.push(line);
            }
        }

        const finalContent = cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n');

        if (finalContent !== originalContent) {
            writeTranscript(filename, finalContent);
            cleanedFiles.push(filename);
            content = finalContent;
        }

        // Extract video ID from frontmatter source URL
        const sourceMatch = content.match(/source:\s*"([^"]+)"/);
        if (!sourceMatch) {
            console.log(`  ⚠️  ${filename}: No source URL found, skipping`);
            continue;
        }

        const videoIdMatch = sourceMatch[1].match(/v=([a-zA-Z0-9_-]{11})/);
        if (!videoIdMatch) {
            console.log(`  ⚠️  ${filename}: Could not extract video ID, skipping`);
            continue;
        }

        const videoId = videoIdMatch[1];

        // --- Step 2: Create missing translation placeholder ---
        const translationPath = path.join(TRANSCRIPTS_DIR, `${videoId}_translation.md`);
        if (!fs.existsSync(translationPath)) {
            console.log(`  📝 ${filename}: Creating translation file...`);
            const titleMatch = content.match(/^title:\s*"([^"]+)"/m);
            const originalTitle = titleMatch ? titleMatch[1] : filename;

            /** @type {{ time: string, text: string }[]} */
            const lines = [];
            const regex = /\*\*(\d{1,2}):(\d{2})(?::(\d{2}))?\*\*\s*[·•]\s*(.+)/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                const time = match[3] ? `${match[1]}:${match[2]}:${match[3]}` : `${match[1]}:${match[2]}`;
                lines.push({ time, text: match[4].trim() });
            }

            let translationContent = `---
title: "${originalTitle} (English Translation)"
source: "${sourceMatch[1]}"
---

`;

            if (lines.length > 0) {
                lines.forEach(line => {
                    translationContent += `**${line.time}** · [TRANSLATION NEEDED] ${line.text}\n\n`;
                });
            } else {
                translationContent += `<!-- No transcript lines found in ${filename} -->\n`;
            }

            fs.writeFileSync(translationPath, translationContent.trim());
            translationsCreated.push(`${videoId}_translation.md`);
        }

        // --- Step 3: Create missing vocabulary file ---
        const vocabPath = path.join(VOCAB_DIR, `${videoId}_vocab.json`);
        if (!fs.existsSync(vocabPath)) {
            console.log(`  📚 ${filename}: Creating vocabulary file...`);

            const excludedWords = loadExcludedWords();
            console.log(`     Total excluded: ${excludedWords.size} words`);

            /** @type {Object.<string, {en: string, grammar?: string}>} */
            const vocab = {};
            const transcriptLines = content.match(/\*\*\d{1,2}:\d{2}[^·]*·\s*(.+)/g) || [];

            transcriptLines.forEach(line => {
                const text = line.replace(/^\*\*[^·]+·\s*/, '');
                const words = text.toLowerCase().match(/[a-záéíóúüñ]+/g) || [];
                words.forEach(word => {
                    // Skip short words and anything in the exclusion list
                    if (word.length > 3 && !excludedWords.has(word)) {
                        const entry = { en: '[translation needed]' };
                        const grammar = detectVerbForm(word);
                        if (grammar) {
                            entry.grammar = grammar;
                        }
                        vocab[word] = entry;
                    }
                });
            });

            // Translate words via API
            const wordsToTranslate = Object.keys(vocab);
            if (wordsToTranslate.length > 0) {
                console.log(`     Translating ${wordsToTranslate.length} words...`);
                let translatedCount = 0;
                const translations = await translateWords(wordsToTranslate, (word, translation) => {
                    if (translation !== '[translation needed]') {
                        translatedCount++;
                        process.stdout.write(`\r     Progress: ${translatedCount}/${wordsToTranslate.length}`);
                    }
                });
                console.log(''); // newline after progress

                for (const [word, translation] of Object.entries(translations)) {
                    vocab[word].en = translation;
                }
            }

            // Alphabetical order
            const sortedVocab = {};
            Object.keys(vocab).sort().forEach(key => {
                sortedVocab[key] = vocab[key];
            });

            writeVocab(videoId, sortedVocab);
            vocabCreated.push(`${videoId}_vocab.json`);
        }
    }

    // --- Report ---
    console.log('\n=== TRANSLATE REPORT ===\n');

    if (cleanedFiles.length > 0) {
        console.log(`✅ Cleaned ${cleanedFiles.length} transcript(s):`);
        cleanedFiles.forEach(f => console.log(`   - ${f}`));
    } else {
        console.log('✅ No transcripts needed cleaning');
    }

    console.log('');

    if (translationsCreated.length > 0) {
        console.log(`📝 Created ${translationsCreated.length} translation placeholder(s):`);
        translationsCreated.forEach(f => console.log(`   - ${f}`));
    } else {
        console.log('✅ All translations exist');
    }

    console.log('');

    if (vocabCreated.length > 0) {
        console.log(`📚 Created ${vocabCreated.length} vocabulary file(s):`);
        vocabCreated.forEach(f => console.log(`   - ${f}`));
    } else {
        console.log('✅ All vocabulary files exist');
    }

    console.log('\n=== TRANSLATE COMPLETE ===\n');
}

module.exports = { runTranslate };
