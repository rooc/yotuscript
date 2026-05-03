/**
 * Word-exclusion / vocabulary-filter module.
 *
 * Loads two JSON word-lists from the data directory:
 *   1. a1-a2.json       — automatically generated A1-A2 Spanish words
 *   2. manual-exclude.json — user-curated extra exclusions
 *
 * Both are merged into a single lowercase Set for O(1) lookups.
 */
const path = require('path');
const fs = require('fs');
const { DATA_DIR } = require('./config');

/**
 * Load and merge excluded-word lists.
 *
 * @returns {Set<string>}
 */
function loadExcludedWords() {
    const excludedWords = new Set();

    const a1a2Path = path.join(DATA_DIR, 'a1-a2.json');
    if (fs.existsSync(a1a2Path)) {
        try {
            const a1a2Data = JSON.parse(fs.readFileSync(a1a2Path, 'utf-8'));
            (a1a2Data.excludedWords || []).forEach(word => excludedWords.add(word.toLowerCase()));
        } catch (e) {
            console.log(`Warning: Could not load a1-a2.json: ${e.message}`);
        }
    }

    const manualPath = path.join(DATA_DIR, 'manual-exclude.json');
    if (fs.existsSync(manualPath)) {
        try {
            const manualData = JSON.parse(fs.readFileSync(manualPath, 'utf-8'));
            (manualData.excludedWords || []).forEach(word => excludedWords.add(word.toLowerCase()));
        } catch (e) {
            console.log(`Warning: Could not load manual-exclude.json: ${e.message}`);
        }
    }

    return excludedWords;
}

module.exports = { loadExcludedWords };
