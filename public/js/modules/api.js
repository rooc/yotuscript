/**
 * API module.
 *
 * Handles all HTTP requests to the backend.
 */

import {
	transcriptContainer,
	setTranscriptData,
	setTranslationData,
	setHasTranslation,
	setTotalDuration,
	setVocabData,
	setCurrentGrammarData,
	setAvailableTranscripts,
	setLearnedVideos,
	setIsLearnedPanelCollapsed,
	setVideoProgress,
	setStatsData,
	learnedVideos,
	isLearnedPanelCollapsed,
	videoProgress,
	statsData,
} from './state.js';
import { setStatus, formatTime, parseTranscriptXML } from './utils.js';

/**
 * Fetch all available transcripts.
 */
export async function loadAvailableTranscripts() {
	try {
		const response = await fetch("/api/transcripts");
		const data = await response.json();
		setAvailableTranscripts(data);
		return data;
	} catch (e) {
		console.error("Failed to load transcript list:", e);
		return [];
	}
}

/**
 * Fetch transcript for a specific video.
 * @param {string} videoId - YouTube video ID
 */
export async function fetchTranscript(videoId) {
	transcriptContainer.innerHTML = '<div class="loading">Loading transcript...</div>';

	try {
		const response = await fetch(`/api/transcript?v=${videoId}`);
		if (!response.ok) throw new Error("No transcript available");

		const contentType = response.headers.get("content-type");
		if (contentType && contentType.includes("json")) {
			const json = await response.json();
			throw new Error(json.error || "No transcript");
		}

		const xml = await response.text();
		const data = parseTranscriptXML(xml);
		setTranscriptData(data);

		if (data.length === 0) throw new Error("Empty transcript");

		const duration = data[data.length - 1].time + data[data.length - 1].dur;
		setTotalDuration(duration);

		setStatus(`Loaded ${data.length} lines, duration: ${formatTime(duration)}`);
		return data;
	} catch (error) {
		console.error("Transcript error:", error);
		transcriptContainer.innerHTML = `<div class="error">No transcript available</div>`;
		throw error;
	}
}

/**
 * Fetch English translation for a video.
 * @param {string} videoId - YouTube video ID
 */
export async function fetchTranslation(videoId) {
	try {
		const response = await fetch(`/api/translation?v=${videoId}`);
		if (!response.ok) {
			setHasTranslation(false);
			return null;
		}

		const contentType = response.headers.get("content-type");
		if (contentType && contentType.includes("json")) {
			setHasTranslation(false);
			return null;
		}

		const xml = await response.text();
		const data = parseTranscriptXML(xml);
		setTranslationData(data);
		setHasTranslation(data.length > 0);
		return data;
	} catch (e) {
		setHasTranslation(false);
		return null;
	}
}

/**
 * Fetch vocabulary for a video.
 * @param {string} videoId - YouTube video ID
 */
export async function fetchVocab(videoId) {
	try {
		const response = await fetch(`/api/vocab?v=${videoId}`);
		if (!response.ok) {
			setVocabData({});
			return {};
		}
		const data = await response.json();
		setVocabData(data);
		return data;
	} catch (e) {
		setVocabData({});
		return {};
	}
}

/**
 * Fetch grammar sentences for a video.
 * @param {string} videoId - YouTube video ID
 */
export async function fetchGrammar(videoId) {
	try {
		const response = await fetch(`/api/grammar?v=${videoId}`);
		if (!response.ok) {
			setCurrentGrammarData([]);
			return [];
		}
		const data = await response.json();
		setCurrentGrammarData(data);
		return data;
	} catch (e) {
		setCurrentGrammarData([]);
		return [];
	}
}

/**
 * Fetch summary for a video.
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object|null>} Summary object or null
 */
export async function fetchSummary(videoId) {
	try {
		const response = await fetch(`/api/summary?v=${videoId}`);
		if (!response.ok) return null;
		const data = await response.json();
		return data && data.summary ? data : null;
	} catch (e) {
		return null;
	}
}

// --- Learned Videos API ---

/**
 * Load learned videos from server or localStorage.
 */
export async function loadLearnedVideos() {
	try {
		const response = await fetch("/api/learned");
		if (response.ok) {
			const data = await response.json();
			setLearnedVideos(data.learnedVideos || []);
			setIsLearnedPanelCollapsed(data.learnedPanelCollapsed !== undefined ? data.learnedPanelCollapsed : true);
			console.log("Loaded learned videos from server:", data.learnedVideos.length);
		} else {
			setLearnedVideos(JSON.parse(localStorage.getItem("learnedVideos") || "[]"));
			setIsLearnedPanelCollapsed(JSON.parse(localStorage.getItem("learnedPanelCollapsed") || "true"));
			console.log("Loaded learned videos from localStorage:", learnedVideos.length);
		}
	} catch (e) {
		setLearnedVideos(JSON.parse(localStorage.getItem("learnedVideos") || "[]"));
		setIsLearnedPanelCollapsed(JSON.parse(localStorage.getItem("learnedPanelCollapsed") || "true"));
		console.log("Loaded learned videos from localStorage (error):", learnedVideos.length);
	}
}

/**
 * Save learned videos to server and localStorage.
 */
export async function saveLearnedVideos() {
	const data = { learnedVideos, learnedPanelCollapsed: isLearnedPanelCollapsed };
	localStorage.setItem("learnedVideos", JSON.stringify(learnedVideos));
	localStorage.setItem("learnedPanelCollapsed", JSON.stringify(isLearnedPanelCollapsed));
	try {
		const response = await fetch("/api/learned", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data)
		});
		if (response.ok) console.log("Saved learned videos to server");
	} catch (e) {
		console.log("Could not save to server, using localStorage only");
	}
}

// --- Progress API ---

/**
 * Load video progress from server or localStorage.
 */
export async function loadVideoProgress() {
	try {
		const response = await fetch("/api/progress");
		if (response.ok) {
			const data = await response.json();
			setVideoProgress(data);
			console.log("Loaded progress from server:", Object.keys(data).length, "videos");
		} else {
			setVideoProgress(JSON.parse(localStorage.getItem("videoProgress") || "{}"));
			console.log("Loaded progress from localStorage:", Object.keys(videoProgress).length, "videos");
		}
	} catch (e) {
		setVideoProgress(JSON.parse(localStorage.getItem("videoProgress") || "{}"));
		console.log("Loaded progress from localStorage (error):", Object.keys(videoProgress).length, "videos");
	}
}

/**
 * Save video progress to server and localStorage.
 * @param {string} currentVideoId - Current video ID
 * @param {Object} player - YouTube player instance
 * @param {number} activeIndex - Current active line index
 */
export async function saveVideoProgress(currentVideoId, player, activeIndex) {
	if (!currentVideoId || !player || !player.getCurrentTime) return;

	const currentTime = player.getCurrentTime();
	const duration = player.getDuration();
	if (duration > 0 && currentTime > 0) {
		const updatedProgress = {
			...videoProgress,
			[currentVideoId]: {
				time: currentTime,
				duration: duration,
				line: activeIndex,
				timestamp: Date.now()
			}
		};
		setVideoProgress(updatedProgress);

		localStorage.setItem("videoProgress", JSON.stringify(updatedProgress));
		try {
			const response = await fetch("/api/progress", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updatedProgress)
			});
			if (response.ok) console.log("Saved progress to server:", currentVideoId, Math.floor(currentTime));
		} catch (e) {
			console.log("Could not save progress to server, using localStorage only");
		}
	}
}

/**
 * Reset progress for a specific video.
 * @param {string} videoId - Video ID to reset
 */
export async function resetVideoProgress(videoId) {
	const updatedProgress = { ...videoProgress };
	delete updatedProgress[videoId];
	setVideoProgress(updatedProgress);
	localStorage.setItem("videoProgress", JSON.stringify(updatedProgress));
	try {
		await fetch("/api/progress", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updatedProgress)
		});
	} catch (e) {
		// Ignore error
	}
}

// --- Stats API ---

/**
 * Load statistics from server or localStorage.
 */
export async function loadStats() {
	// Try localStorage first
	const localStats = localStorage.getItem("statsData");
	if (localStats) {
		try {
			setStatsData(JSON.parse(localStats));
		} catch (e) {
			console.log("Could not parse local stats");
		}
	}

	// Then try server
	try {
		const response = await fetch("/api/stats");
		if (response.ok) {
			const data = await response.json();
			setStatsData({
				totalLearned: data.totalLearned || statsData.totalLearned || 0,
				totalWatchTimeHours: data.totalWatchTimeHours || statsData.totalWatchTimeHours || 0
			});
			console.log("Loaded stats from server:", statsData);
		}
	} catch (e) {
		console.log("Could not load stats from server, using localStorage");
	}
}

/**
 * Save statistics to server and localStorage.
 */
export async function saveStats() {
	localStorage.setItem("statsData", JSON.stringify(statsData));
	try {
		await fetch("/api/stats", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(statsData)
		});
	} catch (e) {
		console.log("Could not save stats to server");
	}
}
