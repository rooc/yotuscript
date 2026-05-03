/**
 * Lint command — validates transcripts and cleans up vocabulary files.
 *
 * Run with:
 *   node server.js lint
 *
 * Checks performed:
 *   • Frontmatter completeness (title + source required)
 *   • Orphaned vocab / translation files (no matching original transcript)
 *   • Empty translation files (placeholders still present)
 *   • Vocabulary cleanup — removes A1-A2 words from vocab JSON
 */
const path = require('path');
const fs = require('fs');
const { TRANSCRIPTS_DIR } = require('../config');
const { findTranscriptFiles, findVocabFiles, readTranscript, readVocab, writeVocab } = require('../store');
const { loadExcludedWords } = require('../exclusions');

/**
 * Execute the full lint suite and print a report to stdout.
 */
function runLint() {
    console.log('\n=== LINT: Checking transcripts ===\n');

    const transcriptFiles = findTranscriptFiles();
    const vocabFiles = findVocabFiles();

    // Derive translation filenames from existing originals
    const translationFiles = findTranscriptFiles()
        .map(f => f.replace(/\.md$/, '').replace(/\.txt$/, ''))
        .filter(base => fs.existsSync(path.join(TRANSCRIPTS_DIR, `${base}_translation.md`)))
        .map(base => `${base}_translation.md`);

    const excludedWords = loadExcludedWords();
    console.log(`Total exclusion list: ${excludedWords.size} words\n`);

    /** @type {{ filename: string, missing: string[] }[]} */
    const incompleteFrontmatter = [];
    /** @type {{ type: string, filename: string }[]} */
    const orphanedFiles = [];
    /** @type {{ filename: string, videoId: string }[]} */
    const emptyTranslations = [];
    /** @type {{ filename: string, removed: number, original: number }[]} */
    const cleanedVocabFiles = [];

    const transcriptBaseNames = transcriptFiles.map(f => f.replace(/\.md$/, '').replace(/\.txt$/, ''));

    // --- Orphaned vocab files ---
    for (const vocabFile of vocabFiles) {
        const baseName = vocabFile.replace('_vocab.json', '');
        if (!transcriptBaseNames.includes(baseName)) {
            orphanedFiles.push({ type: 'vocabulary', filename: vocabFile });
        }
    }

    // --- Orphaned translation files ---
    const allMdFiles = fs.existsSync(TRANSCRIPTS_DIR) ? fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.md')) : [];
    for (const transFile of allMdFiles) {
        if (!transFile.includes('_translation')) continue;
        const baseName = transFile.replace('_translation.md', '');
        if (!transcriptBaseNames.includes(baseName)) {
            orphanedFiles.push({ type: 'translation', filename: transFile });
        }
    }

    // --- Per-transcript checks ---
    for (const filename of transcriptFiles) {
        const content = readTranscript(filename);
        if (!content) continue;

        // Frontmatter validation
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) {
            incompleteFrontmatter.push({ filename, missing: ['entire frontmatter'] });
        } else {
            const frontmatter = frontmatterMatch[1];
            const missing = [];
            if (!frontmatter.match(/^title:\s*/m)) missing.push('title');
            if (!frontmatter.match(/^source:\s*/m)) missing.push('source');
            if (missing.length > 0) {
                incompleteFrontmatter.push({ filename, missing });
            }
        }

        // Extract video ID from source URL
        const sourceMatch = content.match(/source:\s*"([^"]+)"/);
        if (!sourceMatch) {
            console.log(`⚠️  ${filename}: No source URL found`);
            continue;
        }

        const videoIdMatch = sourceMatch[1].match(/v=([a-zA-Z0-9_-]{11})/);
        if (!videoIdMatch) {
            console.log(`⚠️  ${filename}: Could not extract video ID`);
            continue;
        }

        const videoId = videoIdMatch[1];
        console.log(`Processing ${filename}...`);

        // --- Vocab cleanup ---
        const vocab = readVocab(videoId);
        if (vocab) {
            const originalCount = Object.keys(vocab).length;
            let removedCount = 0;
            const filteredVocab = {};

            for (const [word, translation] of Object.entries(vocab)) {
                if (!excludedWords.has(word.toLowerCase())) {
                    filteredVocab[word] = translation;
                } else {
                    removedCount++;
                }
            }

            if (removedCount > 0) {
                writeVocab(videoId, filteredVocab);
                console.log(`   🧹 Removed ${removedCount} A1-A2 words from vocab`);
                cleanedVocabFiles.push({ filename: `${videoId}_vocab.json`, removed: removedCount, original: originalCount });
            }
        }

        // --- Empty translation check ---
        const translationPath = path.join(TRANSCRIPTS_DIR, `${videoId}_translation.md`);
        if (fs.existsSync(translationPath)) {
            try {
                const transContent = fs.readFileSync(translationPath, 'utf-8');
                const hasContent = transContent.match(/\*\*\d{1,2}:\d{2}\*\*\s*[·•]\s*(?!\[?TRANSLATION NEEDED\]?|<!--).*\w+/);
                if (!hasContent) {
                    emptyTranslations.push({ filename: `${videoId}_translation.md`, videoId });
                }
            } catch (e) {
                console.log(`   ⚠️  Error checking translation: ${e.message}`);
            }
        }
    }

    // --- Report ---
    console.log('\n=== LINT REPORT ===\n');

    if (incompleteFrontmatter.length > 0) {
        console.log(`⚠️  ${incompleteFrontmatter.length} transcript(s) with incomplete frontmatter:`);
        incompleteFrontmatter.forEach(item => console.log(`   - ${item.filename}: missing ${item.missing.join(', ')}`));
    } else {
        console.log('✅ All transcripts have complete frontmatter');
    }

    console.log('');

    if (orphanedFiles.length > 0) {
        console.log(`🗑️  ${orphanedFiles.length} orphaned file(s) found:`);
        orphanedFiles.forEach(item => console.log(`   - ${item.filename} (${item.type})`));
    } else {
        console.log('✅ No orphaned files');
    }

    console.log('');

    if (emptyTranslations.length > 0) {
        console.log(`📝 ${emptyTranslations.length} translation(s) need content:`);
        emptyTranslations.forEach(item => console.log(`   - ${item.filename}`));
    } else {
        console.log('✅ All translations have content');
    }

    console.log('');

    if (cleanedVocabFiles.length > 0) {
        console.log(`🧹 Cleaned ${cleanedVocabFiles.length} vocabulary file(s):`);
        cleanedVocabFiles.forEach(v => console.log(`   - ${v.filename}: removed ${v.removed}/${v.original} words`));
    } else {
        console.log('✅ No vocabulary files needed cleaning');
    }

    console.log('\n=== LINT COMPLETE ===\n');
}

module.exports = { runLint };
