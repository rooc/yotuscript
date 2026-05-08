/**
 * Player module.
 *
 * YouTube iframe API integration and video playback controls.
 */

import {
	player,
	setPlayer,
	isPaused,
	setIsPaused,
	currentVideoId,
	setCurrentVideoId,
	setCurrentTime,
	setActiveIndex,
	setSyncInterval,
	syncInterval,
	isSegmentRepeatMode,
	segmentRepeatEndTime,
	setSegmentRepeatEndTime,
	videoWatchSessions,
	setVideoWatchSessions,
	transcriptData,
	pauseBtn,
	fsPauseBtn,
} from './state.js';
import { pauseBtn as pauseBtnState, fsPauseBtn as fsPauseBtnState, setIsFullscreen, isFullscreen } from './state.js';
import { setStatus, formatTime } from './utils.js';
import { saveVideoProgress } from './api.js';
import { updateDisplay } from './transcript.js';
import { startWatchSession, endWatchSession } from './stats.js';

/**
 * Initialize or load a YouTube video.
 * @param {string} videoId - YouTube video ID
 * @param {Object} options - Options including saved progress
 */
export function loadVideo(videoId, options = {}) {
	if (!videoId) return;

	const { savedProgress, onReady } = options;
	const loadingOverlay = document.getElementById("videoLoadingOverlay");

	// Show loading overlay if we have saved progress
	if (savedProgress && loadingOverlay) {
		loadingOverlay.classList.remove("hidden");
	}

	if (player) {
		// Player already exists, just load new video
		if (savedProgress) {
			player.loadVideoById(videoId);
			
			// Wait for video to be ready then seek
			const seekWhenReady = () => {
				const playerState = player.getPlayerState();
				
				if (playerState === YT.PlayerState.PLAYING || 
				    playerState === YT.PlayerState.PAUSED ||
				    playerState === YT.PlayerState.CUED) {
					player.seekTo(savedProgress.time, true);
					setStatus(`Resumed at ${formatTime(savedProgress.time)}`);
					setTimeout(() => {
						if (loadingOverlay) loadingOverlay.classList.add("hidden");
					}, 300);
				} else if (playerState === -1 || playerState === YT.PlayerState.BUFFERING) {
					setTimeout(seekWhenReady, 200);
				} else {
					player.seekTo(savedProgress.time, true);
					setStatus(`Resumed at ${formatTime(savedProgress.time)}`);
					setTimeout(() => {
						if (loadingOverlay) loadingOverlay.classList.add("hidden");
					}, 300);
				}
			};
			
			setTimeout(seekWhenReady, 300);
		} else {
			player.loadVideoById(videoId);
			setTimeout(() => {
				if (loadingOverlay) loadingOverlay.classList.add("hidden");
			}, 300);
		}
		
		if (onReady) onReady();
	} else {
		// Create new player
		setPlayer(new YT.Player("player", {
			videoId: videoId,
			playerVars: { playsinline: 1, rel: 0, autoplay: 0 },
			events: {
				onReady: (event) => {
					if (savedProgress) {
						event.target.pauseVideo();
						event.target.seekTo(savedProgress.time, true);
						setStatus(`Resumed at ${formatTime(savedProgress.time)}`);
						setTimeout(() => {
							event.target.playVideo();
							setTimeout(() => {
								if (loadingOverlay) loadingOverlay.classList.add("hidden");
							}, 300);
						}, 200);
					} else {
						event.target.playVideo();
						if (loadingOverlay) loadingOverlay.classList.add("hidden");
					}
					if (onReady) onReady();
				},
				onStateChange: onPlayerStateChange,
			},
		}));
	}
}

/**
 * Handle YouTube player state changes.
 * @param {Object} event - YouTube player state change event
 */
export function onPlayerStateChange(event) {
	if (event.data === YT.PlayerState.PLAYING) {
		setIsPaused(false);
		const icon = pauseBtn.querySelector(".material-icons");
		if (icon) icon.textContent = "pause";
		pauseBtn.classList.remove("active");
		startWatchSession();
	} else if (event.data === YT.PlayerState.PAUSED) {
		setIsPaused(true);
		const icon = pauseBtn.querySelector(".material-icons");
		if (icon) icon.textContent = "play_arrow";
		pauseBtn.classList.add("active");
		endWatchSession();
		// Restart session for potential resume
		startWatchSession();
	} else if (event.data === YT.PlayerState.ENDED) {
		endWatchSession();
	}
}

/**
 * Toggle play/pause state.
 */
export function togglePause() {
	setPaused(!isPaused);
	saveVideoProgress(currentVideoId, player, -1);
}

/**
 * Set paused state and update UI.
 * @param {boolean} paused - Whether video should be paused
 */
export function setPaused(paused) {
	if (isPaused === paused) return;
	setIsPaused(paused);

	const icon = pauseBtn.querySelector(".material-icons");
	const fsIcon = fsPauseBtn.querySelector(".material-icons");

	if (isPaused) {
		if (icon) icon.textContent = "play_arrow";
		if (fsIcon) fsIcon.textContent = "play_arrow";
		pauseBtn.classList.add("active");
		fsPauseBtn.classList.add("active");
		if (player) player.pauseVideo();
	} else {
		if (icon) icon.textContent = "pause";
		if (fsIcon) fsIcon.textContent = "pause";
		pauseBtn.classList.remove("active");
		fsPauseBtn.classList.remove("active");
		if (player) player.playVideo();
	}

	updateDisplay();
}

/**
 * Restart video from beginning.
 */
export function restartVideo() {
	setCurrentTime(0);
	setActiveIndex(-1);
	setIsPaused(false);

	if (player) {
		player.seekTo(0, true);
		player.playVideo();
	}

	const icon = pauseBtn.querySelector(".material-icons");
	if (icon) icon.textContent = "pause";
	pauseBtn.classList.remove("active");

	setStatus("Restarted");
	updateDisplay();
}

/**
 * Rewind to previous or current segment.
 */
export function rewindBack() {
	const now = Date.now();
	const lastRewindTime = 0; // Will be managed differently in refactored version
	const isDoubleTap = now - lastRewindTime < 500;

	let targetTime;
	if (isDoubleTap && activeIndex > 0) {
		targetTime = transcriptData[activeIndex - 1].time;
	} else if (activeIndex >= 0) {
		targetTime = transcriptData[activeIndex].time;
	} else {
		targetTime = Math.max(0, player?.getCurrentTime() - 10 || 0);
	}
	setActiveIndex(-1);

	if (player) player.seekTo(targetTime, true);
	updateDisplay();
}

/**
 * Forward to next segment.
 */
export function rewindForward() {
	let targetTime;
	if (activeIndex >= 0 && activeIndex < transcriptData.length - 1) {
		targetTime = transcriptData[activeIndex + 1].time;
	} else {
		targetTime = (player?.getCurrentTime() || 0) + 10;
	}
	setActiveIndex(-1);

	if (player) player.seekTo(targetTime, true);
	updateDisplay();
}

/**
 * Toggle fullscreen mode.
 */
export function toggleFullscreen() {
	setIsFullscreen(!isFullscreen);
	document.body.classList.toggle("fullscreen", !isFullscreen);

	const fsPauseIcon = fsPauseBtn.querySelector(".material-icons");
	const pauseIcon = pauseBtn.querySelector(".material-icons");
	if (fsPauseIcon && pauseIcon) {
		fsPauseIcon.textContent = pauseIcon.textContent;
	}
	fsPauseBtn.classList.toggle("active", isPaused);
}

/**
 * Toggle segment repeat mode.
 * @param {Function} renderCallback - Callback to re-render transcript
 */
export function toggleSegmentRepeat(renderCallback) {
	const newMode = !isSegmentRepeatMode;
	import('./state.js').then(state => {
		state.setIsSegmentRepeatMode(newMode);
		
		segmentRepeatBtn.classList.toggle("active", newMode);
		if (fsSegmentRepeatBtn) fsSegmentRepeatBtn.classList.toggle("active", newMode);

		console.log(`SegmentRepeat: Mode ${newMode ? 'ON' : 'OFF'}`);

		if (newMode) {
			updateSegmentEndTime();
			setStatus("Segment repeat mode ON - Press Enter to replay");
		} else {
			setSegmentRepeatEndTime(null);
			setStatus("Segment repeat mode OFF");
		}

		if (renderCallback) renderCallback();
	});
}

/**
 * Update segment end time for repeat mode.
 */
export function updateSegmentEndTime() {
	import('./state.js').then(state => {
		if (state.activeIndex < 0 || state.activeIndex >= state.transcriptData.length) {
			setSegmentRepeatEndTime(null);
			console.log("SegmentRepeat: Invalid index, endTime cleared");
			return;
		}
		
		const currentSegment = state.transcriptData[state.activeIndex];
		const nextSegment = state.transcriptData[state.activeIndex + 1];
		
		if (nextSegment) {
			setSegmentRepeatEndTime(nextSegment.time);
			console.log(`SegmentRepeat: End time set to ${nextSegment.time}s (next segment start)`);
		} else {
			// Last segment - use current segment time + duration
			setSegmentRepeatEndTime(currentSegment.time + (currentSegment.dur || 3));
			console.log(`SegmentRepeat: End time set to ${currentSegment.time + (currentSegment.dur || 3)}s (last segment + duration)`);
		}
	});
}

/**
 * Replay current segment.
 */
export function replayCurrentSegment() {
	import('./state.js').then(state => {
		if (state.activeIndex < 0 || state.activeIndex >= state.transcriptData.length) return;

		const segmentTime = state.transcriptData[state.activeIndex].time;
		console.log(`SegmentRepeat: Replaying segment ${state.activeIndex + 1} from ${segmentTime}s`);
		setCurrentTime(segmentTime);

		if (player) {
			player.seekTo(segmentTime, true);
			player.playVideo();
		}

		setIsPaused(false);
		updateSegmentEndTime();
		updateDisplay();

		// Update button icons
		const icon = pauseBtn.querySelector(".material-icons");
		const fsIcon = fsPauseBtn.querySelector(".material-icons");
		if (icon) icon.textContent = "pause";
		if (fsIcon) fsIcon.textContent = "pause";
		pauseBtn.classList.remove("active");
		fsPauseBtn.classList.remove("active");
	});
}

/**
 * Start syncing transcript with video time.
 */
export function startSync() {
	if (syncInterval) clearInterval(syncInterval);
	const interval = setInterval(syncFromVideo, 200);
	setSyncInterval(interval);
}

/**
 * Sync current time from video player.
 */
function syncFromVideo() {
	if (!player || !player.getCurrentTime) return;
	setCurrentTime(player.getCurrentTime());
	updateDisplay();
}
