/**
 * Vocabular module.
 *
 * Manages saved vocabulary words in the sidebar.
 */

import {
	vocabularWords,
	isVocabularPanelCollapsed,
	vocabData,
	setVocabularWords,
	setIsVocabularPanelCollapsed,
} from "./state.js";
import { saveVocabular } from "./api.js";

let currentVocabularModalIndex = -1;
let showingAnswer = false;

/**
 * Get review count for a vocab word, initializing if needed.
 * @param {Object} item - Vocab word item
 * @returns {number} Review count
 */
function getReviewCount(item) {
	if (typeof item.reviewCount !== "number") {
		item.reviewCount = 0;
	}
	return item.reviewCount;
}

/**
 * Set review count for a vocab word.
 * @param {number} index - Word index
 * @param {number} count - New count
 */
function setReviewCount(index, count) {
	const item = vocabularWords[index];
	if (!item) return;
	item.reviewCount = count;
	// Save to backend
	import("./api.js").then(({ saveVocabular }) => saveVocabular());
}

/**
 * Render vocabular words in the sidebar panel.
 */
export function renderVocabularWords() {
	const container = document.getElementById("vocabularWords");
	const countEl = document.getElementById("vocabularCount");

	if (countEl) {
		countEl.textContent =
			vocabularWords.length > 0 ? `(${vocabularWords.length})` : "";
	}

	if (!vocabularWords || vocabularWords.length === 0) {
		container.innerHTML = "Click words in transcript to add them here";
		return;
	}

	let html = '<div class="vocabular-tags">';
	vocabularWords.forEach((item, index) => {
		html += `
			<div class="vocabular-tag" data-index="${index}" title="Click to see details">
				<span class="vocabular-tag-text">${item.word}</span>
				<span class="vocabular-tag-remove" data-index="${index}" title="Remove">
					<span class="material-icons">close</span>
				</span>
			</div>
		`;
	});
	html += "</div>";

	container.innerHTML = html;

	// Add click handlers for tags (show modal)
	container.querySelectorAll(".vocabular-tag").forEach((tag) => {
		tag.addEventListener("click", (e) => {
			// Don't trigger if clicking the remove button
			if (e.target.closest(".vocabular-tag-remove")) return;
			const index = parseInt(tag.dataset.index);
			showVocabularModal(index);
		});
	});

	// Add click handlers for remove buttons
	container.querySelectorAll(".vocabular-tag-remove").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			e.stopPropagation();
			const index = parseInt(btn.dataset.index);
			removeVocabularWord(index);
		});
	});
}

/**
 * Add a word to the vocabular list.
 * @param {string} word - Spanish word
 * @param {string} translation - English translation
 * @param {string} pos - Part of speech
 * @param {string} context - Original sentence context
 */
export function addVocabularWord(word, translation, pos, context) {
	// Check if word already exists
	const exists = vocabularWords.some((item) => item.word === word);
	if (exists) return;

	const newItem = { word, translation, pos, context, reviewCount: 0 };
	const newList = [...vocabularWords, newItem];
	setVocabularWords(newList);
	renderVocabularWords();
	saveVocabular();

	// Auto-expand panel when adding first word
	if (newList.length === 1 && isVocabularPanelCollapsed) {
		toggleVocabularPanel();
	}
}

/**
 * Remove a word from the vocabular list.
 * @param {number} index - Index of the word to remove
 */
export function removeVocabularWord(index) {
	const newList = vocabularWords.filter((_, i) => i !== index);
	setVocabularWords(newList);
	renderVocabularWords();
	saveVocabular();
}

/**
 * Show vocabular modal for a specific word.
 * @param {number} index - Index of the vocabular word
 */
export function showVocabularModal(index) {
	const item = vocabularWords[index];
	if (!item) return;

	currentVocabularModalIndex = index;
	showingAnswer = false;

	const modal = document.getElementById("vocabularModal");
	const content = document.getElementById("vocabularModalContent");

	renderVocabModalContent(content, item);

	modal.classList.add("active");
}

/**
 * Render the vocab modal content in test mode.
 * @param {HTMLElement} content - Modal content container
 * @param {Object} item - Vocab word item
 * @param {boolean} showAnswer - Whether to show the answer
 */
function renderVocabModalContent(content, item, showAnswer = false) {
	const count = getReviewCount(item);
	const posHtml = item.pos
		? `<div class="vocabular-modal-pos">${item.pos}</div>`
		: "";
	const contextHtml = item.context
		? `<div class="vocabular-modal-context">${item.context}</div>`
		: "";

	// Counter badge
	const counterBadge =
		count > 0 ? `<span class="vocab-counter-badge">${count}/4</span>` : "";

	// Translation display
	let translationHtml;
	let promptHtml = "";

	if (showAnswer) {
		translationHtml = `<div class="vocabular-modal-translation">${item.translation}</div>`;

		if (count >= 4) {
			promptHtml = `
				<div class="vocab-review-prompt vocab-review-suggest">
					<span class="material-icons">emoji_events</span>
					<span>Mastered! Remove from vocab?</span>
					<button onclick="removeCurrentVocabWord()" class="vocab-review-btn vocab-review-btn-remove">
						<span class="material-icons">delete</span> Remove
					</button>
				</div>
			`;
		} else {
			promptHtml = `
				<div class="vocab-review-prompt vocab-review-success">
					<span class="material-icons">check_circle</span>
					<span>Enter to next word</span>
				</div>
			`;
		}
	} else {
		// Replace every non-space character with an asterisk, preserving spaces
		const hiddenText = item.translation.replace(/[^\s]/g, '*');
		translationHtml = `<div class="vocabular-modal-translation vocab-translation-hidden">${hiddenText}</div>`;
		promptHtml = `
			<div class="vocab-review-prompt">
				<span>Remember?</span>
				<div class="vocab-review-buttons">
					<span class="vocab-review-hint"><kbd>Y</kbd> Yes</span>
					<span class="vocab-review-hint"><kbd>N</kbd> No</span>
				</div>
			</div>
		`;
	}

	content.innerHTML = `
		<div class="vocabular-modal-item">
			<div class="vocabular-modal-icon">
				<span class="material-icons">translate</span>
			</div>
			<div class="vocabular-modal-text">
				<div class="vocabular-modal-word">${item.word}${counterBadge}</div>
				${posHtml}
				${translationHtml}
				${promptHtml}
				${contextHtml}
			</div>
		</div>
	`;
}

/**
 * Close the vocabular modal.
 */
export function closeVocabularModal() {
	const modal = document.getElementById("vocabularModal");
	modal.classList.remove("active");
}

/**
 * Toggle the vocabular panel collapsed state.
 */
export function toggleVocabularPanel() {
	setIsVocabularPanelCollapsed(!isVocabularPanelCollapsed);

	const content = document.getElementById("vocabularContent");
	const icon = document.getElementById("vocabularToggleIcon");

	content.classList.toggle("collapsed", isVocabularPanelCollapsed);
	icon.textContent = isVocabularPanelCollapsed ? "expand_more" : "expand_less";

	saveVocabular();
}

/**
 * Handle click on a vocabulary word in the transcript.
 * @param {string} word - The Spanish word clicked
 */
export function handleVocabWordClick(word) {
	const vocabEntry = vocabData[word];
	if (!vocabEntry) return;

	const translation =
		typeof vocabEntry === "string"
			? vocabEntry
			: vocabEntry?.translation || word;
	const pos = typeof vocabEntry === "object" ? vocabEntry.pos : "";
	const context = typeof vocabEntry === "object" ? vocabEntry.context : "";

	addVocabularWord(word, translation, pos, context);
}

/**
 * Remove the currently displayed vocab word and show the next one.
 */
export function removeCurrentVocabWord() {
	if (
		currentVocabularModalIndex >= 0 &&
		currentVocabularModalIndex < vocabularWords.length
	) {
		removeVocabularWord(currentVocabularModalIndex);

		// Show next word, or close if vocab is now empty
		if (vocabularWords.length > 0) {
			const nextIndex =
				currentVocabularModalIndex >= vocabularWords.length
					? 0
					: currentVocabularModalIndex;
			showVocabularModal(nextIndex);
		} else {
			closeVocabularModal();
		}
	}
}

// Make functions available globally for onclick handlers
window.toggleVocabularPanel = toggleVocabularPanel;
window.closeVocabularModal = closeVocabularModal;
window.removeCurrentVocabWord = removeCurrentVocabWord;

// --- Keyboard Navigation ---

document.addEventListener("keydown", function (event) {
	const modal = document.getElementById("vocabularModal");
	if (!modal.classList.contains("active")) return;

	if (vocabularWords.length === 0) return;

	const item = vocabularWords[currentVocabularModalIndex];
	if (!item) return;

	// Y - Yes, I remember (increment counter)
	if (event.code === "KeyY") {
		event.preventDefault();
		if (!showingAnswer) {
			const newCount = getReviewCount(item) + 1;
			setReviewCount(currentVocabularModalIndex, newCount);
			showingAnswer = true;
			const content = document.getElementById("vocabularModalContent");
			renderVocabModalContent(content, item, true);
		} else {
			// If already showing answer, close modal or go to next
			let nextIndex = currentVocabularModalIndex + 1;
			if (nextIndex >= vocabularWords.length) nextIndex = 0;
			showVocabularModal(nextIndex);
		}
		return;
	}

	// N - No, I don't remember (reset counter)
	if (event.code === "KeyN") {
		event.preventDefault();
		if (!showingAnswer) {
			setReviewCount(currentVocabularModalIndex, 0);
			showingAnswer = true;
			const content = document.getElementById("vocabularModalContent");
			renderVocabModalContent(content, item, true);
		} else {
			// If already showing answer, close modal or go to next
			let nextIndex = currentVocabularModalIndex + 1;
			if (nextIndex >= vocabularWords.length) nextIndex = 0;
			showVocabularModal(nextIndex);
		}
		return;
	}

	// Enter / Space - advance to next word (when showing answer)
	if (showingAnswer && (event.code === "Enter" || event.code === "Space")) {
		event.preventDefault();
		let nextIndex = currentVocabularModalIndex + 1;
		if (nextIndex >= vocabularWords.length) nextIndex = 0;
		showVocabularModal(nextIndex);
		return;
	}

	// Esc - close modal
	if (event.code === "Escape") {
		event.preventDefault();
		closeVocabularModal();
		return;
	}

	// Arrow keys for navigation
	if (event.key === "ArrowLeft") {
		event.preventDefault();
		let prevIndex = currentVocabularModalIndex - 1;
		if (prevIndex < 0) prevIndex = vocabularWords.length - 1;
		showVocabularModal(prevIndex);
	} else if (event.key === "ArrowRight") {
		event.preventDefault();
		let nextIndex = currentVocabularModalIndex + 1;
		if (nextIndex >= vocabularWords.length) nextIndex = 0;
		showVocabularModal(nextIndex);
	}
});
