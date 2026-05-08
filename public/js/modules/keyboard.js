/**
 * Keyboard module.
 *
 * Keyboard shortcuts and event handling.
 */

import {
	currentVideoId,
	isSegmentRepeatMode,
} from './state.js';
import { togglePause, rewindBack, rewindForward, restartVideo, toggleFullscreen, toggleSegmentRepeat, replayCurrentSegment } from './player.js';
import { toggleDual } from './transcript.js';
import { toggleLearned } from './learned.js';

/**
 * Setup keyboard event listeners.
 */
export function setupKeyboardHandlers() {
	document.addEventListener("keydown", handleKeyDown);
}

/**
 * Handle keyboard shortcuts.
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeyDown(e) {
	// Space - Pause/Play
	if (e.code === "Space") {
		e.preventDefault();
		togglePause();
		return;
	}

	// Arrow Left - Rewind
	if (e.code === "ArrowLeft") {
		e.preventDefault();
		rewindBack();
		return;
	}

	// Arrow Right - Forward
	if (e.code === "ArrowRight") {
		e.preventDefault();
		rewindForward();
		return;
	}

	// D - Toggle dual translation
	if (e.code === "KeyD" && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
		toggleDual();
		return;
	}

	// F - Toggle fullscreen
	if (e.code === "KeyF" && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
		toggleFullscreen();
		return;
	}

	// L - Toggle learned status
	if (e.code === "KeyL" && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
		toggleLearned(currentVideoId);
		return;
	}

	// R - Toggle segment repeat
	if (e.code === "KeyR" && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
		toggleSegmentRepeat();
		return;
	}

	// Enter - Replay current segment (only in repeat mode)
	if (e.code === "Enter" && isSegmentRepeatMode) {
		e.preventDefault();
		replayCurrentSegment();
		return;
	}
}
