/**
 * Transcript module.
 *
 * Transcript rendering, display synchronization, and UI updates.
 */

import {
	transcriptData,
	translationData,
	hasTranslation,
	activeIndex,
	isDualMode,
	currentTime,
	totalDuration,
	isPaused,
	isSegmentRepeatMode,
	segmentRepeatEndTime,
	transcriptContainer,
	pauseBtn,
	fsPauseBtn,
	setActiveIndex,
	setIsPaused,
} from './state.js';
import { setStatus, formatTime } from './utils.js';
import { wrapVocabWords } from './vocab.js';
import { updateSegmentEndTime } from './player.js';

/**
 * Render the current active transcript line.
 */
export function renderTranscriptLine() {
	if (activeIndex < 0 || activeIndex >= transcriptData.length) return;

	const original = wrapVocabWords(transcriptData[activeIndex].text);
	const translated = hasTranslation && translationData[activeIndex]
		? translationData[activeIndex].text
		: null;

	const pauseIconHtml = isSegmentRepeatMode
		? '<span class="segment-pause-icon"><span class="material-icons">pause</span></span>'
		: '';

	if (isDualMode && translated) {
		transcriptContainer.innerHTML = `
			<div class="transcript-dual">
				<div class="transcript-line original"><span>${original}</span>${pauseIconHtml}</div>
				<div class="transcript-line translated"><span>${translated}</span></div>
			</div>`;
	} else {
		transcriptContainer.innerHTML = `<div class="transcript-line"><span>${original}</span>${pauseIconHtml}</div>`;
	}
}

/**
 * Update display based on current time and state.
 */
export function updateDisplay() {
	if (transcriptData.length === 0) return;

	let newIndex = -1;
	for (let i = 0; i < transcriptData.length; i++) {
		if (transcriptData[i].time <= currentTime) {
			newIndex = i;
		} else {
			break;
		}
	}

	// Auto-pause at end of segment when in segment repeat mode
	if (isSegmentRepeatMode && activeIndex >= 0 && newIndex > activeIndex && !isPaused) {
		import('./state.js').then(state => {
			if (state.player) {
				state.player.pauseVideo();
			}
		});
		setIsPaused(true);

		// Keep display on the segment we just watched
		renderTranscriptLine();

		// Update button icons
		const icon = pauseBtn.querySelector(".material-icons");
		const fsIcon = fsPauseBtn.querySelector(".material-icons");
		if (icon) icon.textContent = "play_arrow";
		if (fsIcon) fsIcon.textContent = "play_arrow";
		pauseBtn.classList.add("active");
		fsPauseBtn.classList.add("active");

		const segmentModeIndicator = " [REPEAT]";
		const segmentCompleteMsg = ` - Segment ${activeIndex + 1} complete (Enter to replay)`;
		setStatus(
			`${formatTime(currentTime)} / ${formatTime(totalDuration)} | Line ${activeIndex + 1}/${transcriptData.length}${segmentModeIndicator} (PAUSED)${segmentCompleteMsg}`,
		);
		return;
	}

	if (newIndex !== activeIndex && newIndex >= 0) {
		// In repeat mode, don't advance to next segment while paused
		if (isSegmentRepeatMode && isPaused && newIndex > activeIndex) {
			// Stay on current segment - don't update activeIndex
		} else {
			setActiveIndex(newIndex);
			// Update segment end time when index changes
			if (isSegmentRepeatMode) {
				updateSegmentEndTime();
			}
			renderTranscriptLine();
		}
	}

	if (totalDuration > 0) {
		document.getElementById("progressFill").style.width =
			`${(currentTime / totalDuration) * 100}%`;
	}

	const segmentModeIndicator = isSegmentRepeatMode ? " [REPEAT]" : "";
	setStatus(
		`${formatTime(currentTime)} / ${formatTime(totalDuration)} | Line ${activeIndex + 1}/${transcriptData.length}${segmentModeIndicator} ${isPaused ? "(PAUSED)" : ""}`,
	);
}

/**
 * Toggle dual mode (show translation).
 * @param {Function} renderCallback - Callback to re-render transcript
 */
export function toggleDual(renderCallback) {
	import('./state.js').then(state => {
		const newMode = !isDualMode;
		state.setIsDualMode(newMode);
		
		const dualBtn = document.getElementById("dualBtn");
		const fsDualBtn = document.getElementById("fsDualBtn");
		
		dualBtn.classList.toggle("active", newMode);
		fsDualBtn.classList.toggle("active", newMode);
		
		if (activeIndex >= 0 && renderCallback) renderCallback();
	});
}
