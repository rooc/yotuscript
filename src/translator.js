/**
 * Simple Spanish-to-English translator using MyMemory API.
 *
 * Free tier: ~1000 words/day without API key.
 * Falls back to placeholder on errors or rate limits.
 */
const https = require('https');

/**
 * Translate a single Spanish word to English.
 *
 * @param {string} word
 * @returns {Promise<string>}
 */
function translateWord(word) {
	return new Promise((resolve) => {
		const encoded = encodeURIComponent(word);
		const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=es|en`;

		const req = https.get(url, (res) => {
			let data = '';
			res.on('data', chunk => data += chunk);
			res.on('end', () => {
				try {
					const json = JSON.parse(data);
					if (json.responseStatus === 200 && json.responseData?.translatedText) {
						const translated = json.responseData.translatedText.toLowerCase().trim();
						// Filter out obvious garbage or same-word translations
						if (translated && translated !== word && translated !== '[translation needed]') {
							resolve(translated);
							return;
						}
					}
				} catch (e) {
					// JSON parse error
				}
				resolve('[translation needed]');
			});
		});

		req.on('error', () => {
			resolve('[translation needed]');
		});

		req.setTimeout(5000, () => {
			req.destroy();
			resolve('[translation needed]');
		});
	});
}

/**
 * Translate multiple words with a small delay between each
 * to respect rate limits.
 *
 * @param {string[]} words
 * @param {(word: string, translation: string) => void} onProgress
 * @returns {Promise<Object.<string, string>>}
 */
async function translateWords(words, onProgress) {
	const results = {};
	const delay = (ms) => new Promise(r => setTimeout(r, ms));

	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		const translation = await translateWord(word);
		results[word] = translation;
		if (onProgress) onProgress(word, translation);

		// Small delay to be nice to the API (300ms between requests)
		if (i < words.length - 1) {
			await delay(300);
		}
	}

	return results;
}

module.exports = { translateWord, translateWords };
