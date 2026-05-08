/**
 * Central state management module.
 *
 * Contains all application state variables as mutable exports.
 * Other modules import and modify these as needed.
 */

// --- Player & Video State ---
export let player = null;
export let currentVideoId = null;
export let currentTime = 0;
export let totalDuration = 0;
export let isPaused = false;
export let isFullscreen = false;
export let syncInterval = null;

// --- Transcript State ---
export let transcriptData = [];
export let translationData = [];
export let hasTranslation = false;
export let activeIndex = -1;
export let isDualMode = false;
export let availableTranscripts = [];

// --- Vocabulary State ---
export let vocabData = {};

// --- Segment Repeat State ---
export let isSegmentRepeatMode = false;
export let segmentRepeatEndTime = null;
export let lastRewindTime = 0;

// --- Learned Videos State ---
export let learnedVideos = [];
export let isLearnedPanelCollapsed = true;

// --- Grammar & Summary State ---
export let currentGrammarData = [];
export let isGrammarPanelCollapsed = true;

// --- Statistics State ---
export let videoProgress = {};
export let statsData = { totalLearned: 0, totalWatchTimeHours: 0 };
export let videoWatchSessions = {};

// --- Drag & Drop State ---
export let draggedVideoId = null;

// --- DOM References ---
export const statusEl = document.getElementById("status");
export const pauseBtn = document.getElementById("pauseBtn");
export const dualBtn = document.getElementById("dualBtn");
export const fsPauseBtn = document.getElementById("fsPauseBtn");
export const fsDualBtn = document.getElementById("fsDualBtn");
export const transcriptContainer = document.getElementById("transcript");
export const segmentRepeatBtn = document.getElementById("segmentRepeatBtn");
export const fsSegmentRepeatBtn = document.getElementById("fsSegmentRepeatBtn");

// --- Setters for state mutations ---
export function setPlayer(value) { player = value; }
export function setCurrentVideoId(value) { currentVideoId = value; }
export function setCurrentTime(value) { currentTime = value; }
export function setTotalDuration(value) { totalDuration = value; }
export function setIsPaused(value) { isPaused = value; }
export function setIsFullscreen(value) { isFullscreen = value; }
export function setSyncInterval(value) { syncInterval = value; }

export function setTranscriptData(value) { transcriptData = value; }
export function setTranslationData(value) { translationData = value; }
export function setHasTranslation(value) { hasTranslation = value; }
export function setActiveIndex(value) { activeIndex = value; }
export function setIsDualMode(value) { isDualMode = value; }
export function setAvailableTranscripts(value) { availableTranscripts = value; }

export function setVocabData(value) { vocabData = value; }

export function setIsSegmentRepeatMode(value) { isSegmentRepeatMode = value; }
export function setSegmentRepeatEndTime(value) { segmentRepeatEndTime = value; }
export function setLastRewindTime(value) { lastRewindTime = value; }

export function setLearnedVideos(value) { learnedVideos = value; }
export function setIsLearnedPanelCollapsed(value) { isLearnedPanelCollapsed = value; }

export function setCurrentGrammarData(value) { currentGrammarData = value; }
export function setIsGrammarPanelCollapsed(value) { isGrammarPanelCollapsed = value; }

export function setVideoProgress(value) { videoProgress = value; }
export function setStatsData(value) { statsData = value; }
export function setVideoWatchSessions(value) { videoWatchSessions = value; }

export function setDraggedVideoId(value) { draggedVideoId = value; }
