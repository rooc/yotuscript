/**
 * YT-trans frontend application.
 *
 * Handles YouTube iframe API integration, transcript synchronization,
 * dual-language display, vocabulary highlighting, keyboard shortcuts,
 * and learned-video tracking.
 */

// --- State ---
let transcriptData = [];
let translationData = [];
let hasTranslation = false;
let activeIndex = -1;
let availableTranscripts = [];
let currentTime = 0;
let totalDuration = 0;
let isPaused = false;
let isDualMode = false;
let isFullscreen = false;
let player = null;
let syncInterval = null;
let vocabData = {};
let currentVideoId = null;
let lastRewindTime = 0;
let learnedVideos = [];
let isLearnedPanelCollapsed = true;

// --- DOM References ---
const statusEl = document.getElementById("status");
const pauseBtn = document.getElementById("pauseBtn");
const dualBtn = document.getElementById("dualBtn");
const fsPauseBtn = document.getElementById("fsPauseBtn");
const fsDualBtn = document.getElementById("fsDualBtn");
const learnBtn = document.getElementById("learnBtn");
const fsLearnBtn = document.getElementById("fsLearnBtn");
const transcriptContainer = document.getElementById("transcript");

// --- Learned Videos (server + localStorage) ---

async function loadLearnedVideos() {
	try {
		const response = await fetch("/api/learned");
		if (response.ok) {
			const data = await response.json();
			learnedVideos = data.learnedVideos || [];
			isLearnedPanelCollapsed = data.learnedPanelCollapsed !== undefined ? data.learnedPanelCollapsed : true;
			console.log("Loaded learned videos from server:", learnedVideos.length);
		} else {
			learnedVideos = JSON.parse(localStorage.getItem("learnedVideos") || "[]");
			isLearnedPanelCollapsed = JSON.parse(localStorage.getItem("learnedPanelCollapsed") || "true");
			console.log("Loaded learned videos from localStorage:", learnedVideos.length);
		}
	} catch (e) {
		learnedVideos = JSON.parse(localStorage.getItem("learnedVideos") || "[]");
		isLearnedPanelCollapsed = JSON.parse(localStorage.getItem("learnedPanelCollapsed") || "true");
		console.log("Loaded learned videos from localStorage (error):", learnedVideos.length);
	}
}

async function saveLearnedVideos() {
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

// --- Display & Formatting ---

function setStatus(msg) {
	statusEl.textContent = msg;
}

function formatTime(seconds) {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function parseTranscriptXML(xml) {
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

// --- Vocabulary Highlighting ---

function wrapVocabWords(text) {
	if (!vocabData || Object.keys(vocabData).length === 0) return text;

	const matches = [];
	const sorted = Object.keys(vocabData).sort((a, b) => b.length - a.length);

	for (const word of sorted) {
		const regex = new RegExp(`(^|[^\\wáéíóúüñÁÉÍÓÚÜÑ])(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?=[^\\wáéíóúüñÁÉÍÓÚÜÑ]|$)`, "gi");
		let match;
		while ((match = regex.exec(text)) !== null) {
			const start = match.index + match[1].length;
			const end = start + word.length;
			const overlaps = matches.some(m => (start < m.end && end > m.start));
			if (!overlaps) {
				matches.push({ start, end, word, text: match[2] });
			}
		}
	}

	matches.sort((a, b) => b.start - a.start);

	let result = text;
	for (const match of matches) {
		const entry = vocabData[match.word];
		const translation = (typeof entry === 'object' ? entry.en : entry).replace(/"/g, '&quot;');
		const grammar = typeof entry === 'object' && entry.grammar ? entry.grammar.replace(/"/g, '&quot;') : '';
		const before = result.slice(0, match.start);
		const after = result.slice(match.end);
		const grammarAttr = grammar ? ` data-grammar="${grammar}"` : '';
		const wrapped = `<span class="vocab-word" data-en="${translation}"${grammarAttr}>${match.text}</span>`;
		result = before + wrapped + after;
	}

	return result;
}

// --- Transcript Rendering ---

function renderTranscriptLine() {
	if (activeIndex < 0 || activeIndex >= transcriptData.length) return;

	const original = wrapVocabWords(transcriptData[activeIndex].text);
	const translated = hasTranslation && translationData[activeIndex]
		? translationData[activeIndex].text
		: null;

	if (isDualMode && translated) {
		transcriptContainer.innerHTML = `
			<div class="transcript-dual">
				<div class="transcript-line original"><span>${original}</span></div>
				<div class="transcript-line translated"><span>${translated}</span></div>
			</div>`;
	} else {
		transcriptContainer.innerHTML = `<div class="transcript-line"><span>${original}</span></div>`;
	}
}

function updateDisplay() {
	if (transcriptData.length === 0) return;

	let newIndex = -1;
	for (let i = 0; i < transcriptData.length; i++) {
		if (transcriptData[i].time <= currentTime) {
			newIndex = i;
		} else {
			break;
		}
	}

	if (newIndex !== activeIndex && newIndex >= 0) {
		activeIndex = newIndex;
		renderTranscriptLine();
	}

	if (totalDuration > 0) {
		document.getElementById("progressFill").style.width =
			`${(currentTime / totalDuration) * 100}%`;
	}

	setStatus(
		`${formatTime(currentTime)} / ${formatTime(totalDuration)} | Line ${activeIndex + 1}/${transcriptData.length} ${isPaused ? "(PAUSED)" : ""}`,
	);
}

function syncFromVideo() {
	if (!player || !player.getCurrentTime) return;
	currentTime = player.getCurrentTime();
	updateDisplay();
}

function startSync() {
	if (syncInterval) clearInterval(syncInterval);
	syncInterval = setInterval(syncFromVideo, 200);
}

// --- Playback Controls ---

function setPaused(paused) {
	if (isPaused === paused) return;
	isPaused = paused;

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

function togglePause() {
	setPaused(!isPaused);
}

function syncVideo() {
	if (player) {
		player.seekTo(currentTime, true);
		setStatus(`Synced video to ${formatTime(currentTime)}`);
	}
}

function restartVideo() {
	currentTime = 0;
	activeIndex = -1;
	isPaused = false;

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

function rewindBack() {
	const now = Date.now();
	const isDoubleTap = now - lastRewindTime < 500;
	lastRewindTime = now;

	if (isDoubleTap && activeIndex > 0) {
		currentTime = transcriptData[activeIndex - 1].time;
	} else if (activeIndex >= 0) {
		currentTime = transcriptData[activeIndex].time;
	} else {
		currentTime = Math.max(0, currentTime - 10);
	}
	activeIndex = -1;

	if (player) player.seekTo(currentTime, true);
	updateDisplay();
}

function rewindForward() {
	if (activeIndex >= 0 && activeIndex < transcriptData.length - 1) {
		currentTime = transcriptData[activeIndex + 1].time;
	} else {
		currentTime = currentTime + 10;
	}
	activeIndex = -1;

	if (player) player.seekTo(currentTime, true);
	updateDisplay();
}

// --- Mode Toggles ---

function toggleDual() {
	isDualMode = !isDualMode;
	dualBtn.classList.toggle("active", isDualMode);
	fsDualBtn.classList.toggle("active", isDualMode);
	if (activeIndex >= 0) renderTranscriptLine();
}

function toggleFullscreen() {
	isFullscreen = !isFullscreen;
	document.body.classList.toggle("fullscreen", isFullscreen);

	const fsPauseIcon = fsPauseBtn.querySelector(".material-icons");
	const pauseIcon = pauseBtn.querySelector(".material-icons");
	if (fsPauseIcon && pauseIcon) {
		fsPauseIcon.textContent = pauseIcon.textContent;
	}
	fsPauseBtn.classList.toggle("active", isPaused);
	fsDualBtn.classList.toggle("active", isDualMode);
	updateLearnedButtonState();
}

// --- Learned Tracking ---

function toggleLearned() {
	if (!currentVideoId) return;

	const index = learnedVideos.indexOf(currentVideoId);
	if (index > -1) {
		learnedVideos.splice(index, 1);
	} else {
		learnedVideos.push(currentVideoId);
	}

	saveLearnedVideos();
	updateLearnedButtonState();
	loadAvailableTranscripts();
}

function updateLearnedButtonState() {
	const isLearned = learnedVideos.includes(currentVideoId);
	learnBtn.classList.toggle("active", isLearned);
	fsLearnBtn.classList.toggle("active", isLearned);
	learnBtn.title = isLearned ? "Mark as not learned (L)" : "Mark as learned (L)";
	fsLearnBtn.title = isLearned ? "Mark as not learned (L)" : "Mark as learned (L)";
}

function toggleLearnedPanel() {
	isLearnedPanelCollapsed = !isLearnedPanelCollapsed;
	saveLearnedVideos();

	const content = document.getElementById("learnedTags");
	const icon = document.getElementById("learnedToggleIcon");

	content.classList.toggle("collapsed", isLearnedPanelCollapsed);
	icon.textContent = isLearnedPanelCollapsed ? "chevron_right" : "expand_more";
}

// --- Data Fetching ---

async function loadAvailableTranscripts() {
	try {
		const response = await fetch("/api/transcripts");
		availableTranscripts = await response.json();

		const tagsContainer = document.getElementById("transcriptTags");
		const learnedContainer = document.getElementById("learnedTags");

		const unlearned = availableTranscripts.filter(t => !learnedVideos.includes(t.videoId));
		const learned = availableTranscripts.filter(t => learnedVideos.includes(t.videoId));

		if (unlearned.length === 0) {
			tagsContainer.innerHTML = '<span style="color: #666">No transcripts to learn</span>';
		} else {
			tagsContainer.innerHTML = unlearned
				.map((t) => {
					const title = t.title || t.videoId;
					const icon = t.hasTranslation
						? '<span class="material-icons icon-sm">translate</span>'
						: '<span class="material-icons icon-sm warning" title="No translation">error_outline</span>';
					return `<span class="transcript-tag" id="tag-${t.videoId}" onclick="loadByVideoId('${t.videoId}')" title="${title}">${title} ${icon}</span>`;
				})
				.join("");
		}

		if (learned.length === 0) {
			learnedContainer.innerHTML = '<span style="color: #666; font-size: 0.85rem;">No learned transcripts yet</span>';
		} else {
			learnedContainer.innerHTML = learned
				.map((t) => {
					const title = t.title || t.videoId;
					const icon = t.hasTranslation
						? '<span class="material-icons icon-sm">translate</span>'
						: '<span class="material-icons icon-sm warning" title="No translation">error_outline</span>';
					return `<span class="transcript-tag learned" id="tag-${t.videoId}" onclick="loadByVideoId('${t.videoId}')" title="${title}">${title} ${icon}</span>`;
				})
				.join("");
		}

		const content = document.getElementById("learnedTags");
		const icon = document.getElementById("learnedToggleIcon");
		content.classList.toggle("collapsed", isLearnedPanelCollapsed);
		icon.textContent = isLearnedPanelCollapsed ? "chevron_right" : "expand_more";
	} catch (e) {
		console.error("Failed to load transcript list:", e);
	}
}

async function fetchTranscript(videoId) {
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
		transcriptData = parseTranscriptXML(xml);

		if (transcriptData.length === 0) throw new Error("Empty transcript");

		totalDuration = transcriptData[transcriptData.length - 1].time +
			transcriptData[transcriptData.length - 1].dur;

		setStatus(`Loaded ${transcriptData.length} lines, duration: ${formatTime(totalDuration)}`);
	} catch (error) {
		console.error("Transcript error:", error);
		transcriptContainer.innerHTML = `<div class="error">No transcript available</div>`;
	}
}

async function fetchTranslation(videoId) {
	try {
		const response = await fetch(`/api/translation?v=${videoId}`);
		if (!response.ok) { hasTranslation = false; return; }

		const contentType = response.headers.get("content-type");
		if (contentType && contentType.includes("json")) { hasTranslation = false; return; }

		const xml = await response.text();
		translationData = parseTranscriptXML(xml);
		hasTranslation = translationData.length > 0;
	} catch (e) {
		hasTranslation = false;
	}
}

async function fetchVocab(videoId) {
	try {
		const response = await fetch(`/api/vocab?v=${videoId}`);
		if (!response.ok) { vocabData = {}; return; }
		vocabData = await response.json();
	} catch (e) {
		vocabData = {};
	}
}

// --- Video Loading ---

function loadByVideoId(videoId) {
	currentVideoId = videoId;
	document.querySelectorAll(".transcript-tag").forEach((tag) => {
		tag.classList.remove("active");
	});
	const activeTag = document.getElementById(`tag-${videoId}`);
	if (activeTag) activeTag.classList.add("active");
	updateLearnedButtonState();
	loadVideo(videoId);
}

function loadVideo(videoId) {
	if (!videoId) return;

	if (syncInterval) clearInterval(syncInterval);
	isPaused = false;
	activeIndex = -1;

	const icon = pauseBtn.querySelector(".material-icons");
	if (icon) icon.textContent = "pause";
	pauseBtn.classList.remove("active");

	const titleEl = document.getElementById("videoTitle");
	const transcript = availableTranscripts.find((t) => t.videoId === videoId);
	if (transcript && transcript.fullTitle) {
		titleEl.textContent = transcript.fullTitle;
	} else {
		titleEl.textContent = `Video: ${videoId}`;
	}

	Promise.all([
		fetchTranscript(videoId),
		fetchTranslation(videoId),
		fetchVocab(videoId),
	]).then(() => {
		if (player) {
			player.addEventListener("onStateChange", onPlayerStateChange);
			player.loadVideoById(videoId);
		} else {
			player = new YT.Player("player", {
				videoId: videoId,
				playerVars: { playsinline: 1, rel: 0 },
				events: {
					onReady: () => startSync(),
					onStateChange: onPlayerStateChange,
				},
			});
		}
		startSync();
	});
}

function onPlayerStateChange(e) {
	if (e.data === YT.PlayerState.PLAYING) {
		isPaused = false;
		const icon = pauseBtn.querySelector(".material-icons");
		if (icon) icon.textContent = "pause";
		pauseBtn.classList.remove("active");
	} else if (e.data === YT.PlayerState.PAUSED) {
		isPaused = true;
		const icon = pauseBtn.querySelector(".material-icons");
		if (icon) icon.textContent = "play_arrow";
		pauseBtn.classList.add("active");
	}
}

// --- Initialization ---

window.onload = async function() {
	await loadLearnedVideos();
	await loadAvailableTranscripts();
};

// --- Keyboard Shortcuts ---

document.addEventListener("keydown", function (e) {
	if (e.code === "Space") {
		e.preventDefault();
		togglePause();
	}
	if (e.code === "ArrowLeft") {
		e.preventDefault();
		rewindBack();
	}
	if (e.code === "ArrowRight") {
		e.preventDefault();
		rewindForward();
	}
	if (e.code === "KeyS" && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
		syncVideo();
	}
	if (e.code === "KeyD" && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
		toggleDual();
	}
	if (e.code === "KeyF" && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
		toggleFullscreen();
	}
	if (e.code === "KeyL" && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
		toggleLearned();
	}
});

// --- Vocabulary Tooltip ---

const vocabTooltip = document.getElementById("vocab-tooltip");
const vocabTooltipTranslation = vocabTooltip.querySelector(".vocab-tooltip-translation");
const vocabTooltipGrammar = vocabTooltip.querySelector(".vocab-tooltip-grammar");

function showVocabTooltip(target) {
	const en = target.dataset.en;
	const grammar = target.dataset.grammar;
	if (!en) return;

	vocabTooltipTranslation.textContent = en;
	if (grammar) {
		vocabTooltipGrammar.textContent = grammar;
		vocabTooltipGrammar.style.display = "";
	} else {
		vocabTooltipGrammar.style.display = "none";
	}

	vocabTooltip.classList.remove("hidden");
	positionVocabTooltip(target);
}

function positionVocabTooltip(target) {
	const rect = target.getBoundingClientRect();
	const tooltipRect = vocabTooltip.getBoundingClientRect();

	let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
	let top = rect.top - tooltipRect.height - 8;

	// Keep within viewport
	if (left < 8) left = 8;
	if (left + tooltipRect.width > window.innerWidth - 8) {
		left = window.innerWidth - tooltipRect.width - 8;
	}
	if (top < 8) {
		top = rect.bottom + 8;
	}

	vocabTooltip.style.left = `${left + window.scrollX}px`;
	vocabTooltip.style.top = `${top + window.scrollY}px`;
}

function hideVocabTooltip() {
	vocabTooltip.classList.add("hidden");
}

// Use event delegation for dynamically created vocab words
document.addEventListener("mouseover", (e) => {
	const word = e.target.closest(".vocab-word");
	if (word) showVocabTooltip(word);
});

document.addEventListener("mouseout", (e) => {
	const word = e.target.closest(".vocab-word");
	if (word) hideVocabTooltip();
});
