/**
 * Central configuration module.
 *
 * Defines filesystem paths and runtime constants so every other module
 * reads from a single source of truth.
 */
const path = require("path");
const os = require("os");

const ROOT_DIR = path.join(__dirname, "..");

// User data location — configurable via env var or defaults to ~/Work/yotuscript/.data/
const DATA_ROOT =
	process.env.YOTUSCRIPT_DATA ||
	path.join(os.homedir(), "Work", "yotuscript", ".data");

/**
 * @typedef {Object} AppConfig
 * @property {number} PORT            — HTTP server port
 * @property {string} ROOT_DIR        — project root absolute path
 * @property {string} TRANSCRIPTS_DIR — folder containing .md transcript files
 * @property {string} VOCAB_DIR       — folder containing _vocab.json files
 * @property {string} GRAMMAR_DIR     — folder containing _grammar.json files
 * @property {string} DATA_DIR        — folder containing a1-a2.json, learned.json, etc.
 */

/** @type {AppConfig} */
module.exports = {
	PORT: 9090,
	ROOT_DIR,
	TRANSCRIPTS_DIR: path.join(DATA_ROOT, "transcripts"),
	VOCAB_DIR: path.join(DATA_ROOT, "vocab"),
	GRAMMAR_DIR: path.join(DATA_ROOT, "grammar"),
	SUMMARY_DIR: path.join(DATA_ROOT, "summary"),
	DATA_DIR: path.join(DATA_ROOT, "data"),
	STATS_PATH: path.join(DATA_ROOT, "data", "stats.json"),
};
