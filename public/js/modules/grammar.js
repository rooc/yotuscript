/**
 * Grammar module.
 *
 * Grammar sentences rendering, summary display, and modal management.
 */

import {
	currentGrammarData,
	isGrammarPanelCollapsed,
	setIsGrammarPanelCollapsed,
} from './state.js';
import { fetchSummary } from './api.js';

let currentSummary = null;

/**
 * Render grammar sentences in the panel.
 * @param {Array} grammar - Array of grammar sentence objects
 */
export function renderGrammarSentences(grammar) {
	const container = document.getElementById("grammarSentences");
	
	if (!grammar || grammar.length === 0) {
		container.innerHTML = 'No grammar sentences available for this video';
		return;
	}
	
	let html = '<div class="grammar-tags">';
	grammar.forEach((item, index) => {
		// Extract first 3-4 words for the tag
		const shortText = item.spanish.split(' ').slice(0, 4).join(' ') + '...';
		html += `
			<div class="grammar-tag" data-index="${index}" title="Click to see full sentence">
				<span class="grammar-tag-number">${index + 1}</span>
				<span class="grammar-tag-text">${shortText}</span>
			</div>
		`;
	});
	html += '</div>';
	
	container.innerHTML = html;
	
	// Add click handlers
	container.querySelectorAll('.grammar-tag').forEach(tag => {
		tag.addEventListener('click', () => {
			const index = parseInt(tag.dataset.index);
			showGrammarModal(index);
		});
	});
}

/**
 * Show grammar modal for a specific sentence.
 * @param {number} index - Index of the grammar sentence
 */
export function showGrammarModal(index) {
	const item = currentGrammarData[index];
	if (!item) return;
	
	const modal = document.getElementById("grammarModal");
	const content = document.getElementById("grammarModalContent");
	
	content.innerHTML = `
		<div class="grammar-modal-item">
			<div class="grammar-modal-icon">
				<span class="material-icons">menu_book</span>
			</div>
			<div class="grammar-modal-text">
				<div class="grammar-modal-spanish">${item.spanish}</div>
				<div class="grammar-modal-english">${item.english}</div>
				<div class="grammar-modal-explanation">${item.explanation}</div>
			</div>
		</div>
	`;
	
	modal.classList.add("active");
}

/**
 * Close the grammar modal.
 */
export function closeGrammarModal() {
	const modal = document.getElementById("grammarModal");
	modal.classList.remove("active");
}

/**
 * Toggle the grammar panel collapsed state.
 */
export function toggleGrammarPanel() {
	setIsGrammarPanelCollapsed(!isGrammarPanelCollapsed);
	
	const content = document.getElementById("grammarContent");
	const icon = document.getElementById("grammarToggleIcon");
	
	content.classList.toggle("collapsed", isGrammarPanelCollapsed);
	icon.textContent = isGrammarPanelCollapsed ? "expand_more" : "expand_less";
}

/**
 * Load and display summary for a video.
 * @param {string} videoId - Video ID
 */
export async function loadSummary(videoId) {
	currentSummary = await fetchSummary(videoId);
	updateSummaryIconVisibility();
}

/**
 * Update summary icon visibility based on current summary.
 */
export function updateSummaryIconVisibility() {
	const summaryIcon = document.getElementById("summaryIcon");
	if (summaryIcon) {
		summaryIcon.style.display = currentSummary ? 'flex' : 'none';
	}
}

/**
 * Show summary modal.
 */
export function showSummaryModal() {
	if (!currentSummary) return;
	
	const modal = document.getElementById("summaryModal");
	const textEl = document.getElementById("summaryText");
	
	textEl.textContent = currentSummary.summary;
	modal.classList.add("active");
}

/**
 * Close summary modal.
 */
export function closeSummaryModal() {
	const modal = document.getElementById("summaryModal");
	modal.classList.remove("active");
}

/**
 * Setup modal close handlers (click outside, ESC key).
 */
export function setupModalHandlers() {
	// Close modal when clicking outside
	window.addEventListener('click', function(event) {
		const grammarModal = document.getElementById("grammarModal");
		const summaryModal = document.getElementById("summaryModal");
		
		if (event.target === grammarModal) {
			closeGrammarModal();
		} else if (event.target === summaryModal) {
			closeSummaryModal();
		}
	});

	// Close modal with ESC key
	document.addEventListener('keydown', function(event) {
		if (event.key === "Escape") {
			const grammarModal = document.getElementById("grammarModal");
			const summaryModal = document.getElementById("summaryModal");
			
			if (grammarModal.classList.contains("active")) {
				closeGrammarModal();
			} else if (summaryModal.classList.contains("active")) {
				closeSummaryModal();
			}
		}
	});
}

// Make modal functions available globally for onclick handlers
window.showSummaryModal = showSummaryModal;
window.closeSummaryModal = closeSummaryModal;
window.closeGrammarModal = closeGrammarModal;
window.toggleGrammarPanel = toggleGrammarPanel;
