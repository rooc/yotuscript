/**
 * Utility functions module.
 *
 * General helper functions for formatting, parsing, and display.
 */

import { statusEl } from './state.js';

/**
 * Set the status message text.
 * @param {string} msg - Message to display
 */
export function setStatus(msg) {
	statusEl.textContent = msg;
}

/**
 * Format seconds into MM:SS format.
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Parse XML transcript data into array of objects.
 * @param {string} xml - XML string from API
 * @returns {Array<{time: number, dur: number, text: string}>} Parsed transcript lines
 */
export function parseTranscriptXML(xml) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, "text/xml");
	const texts = doc.querySelectorAll("text");
	const result = [];
	texts.forEach((text) => {
		const start = parseFloat(text.getAttribute("start"));
		const dur = parseFloat(text.getAttribute("dur")) || 3;
		const content = text.textContent.trim();
		if (content) {
			result.push({ time: start, dur: dur, text: content });
		}
	});
	return result;
}

/**
 * Copy text to clipboard.
 * @param {string} text - Text to copy
 * @param {Function} onSuccess - Callback on success
 * @param {Function} onError - Callback on error
 */
export async function copyToClipboard(text, onSuccess, onError) {
	try {
		await navigator.clipboard.writeText(text);
		if (onSuccess) onSuccess();
	} catch (err) {
		console.error('Failed to copy:', err);
		if (onError) onError();
	}
}
