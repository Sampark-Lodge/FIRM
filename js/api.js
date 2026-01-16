// api.js - Communication with Google Apps Script Backend

// Configuration
const API_CONFIG = {
    webAppUrl: 'https://script.google.com/macros/s/AKfycbyyD1253gXSTQESMth2H2iuqo8W9amApRHVbJKVhvT_4xgPf4e8p5_DMlCXf122lAe_JQ/exec', // Deployed Web App URL
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
};

/**
 * Make a GET request to the Apps Script backend
 * @param {string} action - The action to perform
 * @param {object} params - Additional parameters
 * @returns {Promise<object>} Response data
 */
async function apiGet(action, params = {}) {
    const url = new URL(API_CONFIG.webAppUrl);
    url.searchParams.append('action', action);

    // Add additional parameters
    Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
    });

    return await fetchWithRetry(url.toString(), {
        method: 'GET',
        mode: 'cors'
    });
}

/**
 * Make a POST request to the Apps Script backend
 * @param {string} action - The action to perform
 * @param {object} data - Data to send
 * @returns {Promise<object>} Response data
 */
async function apiPost(action, data = {}) {
    // Use URL-encoded format to avoid CORS preflight
    const params = new URLSearchParams();
    params.append('action', action);

    // Add all data fields as form parameters
    Object.keys(data).forEach(key => {
        params.append(key, data[key]);
    });

    return await fetchWithRetry(API_CONFIG.webAppUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    });
}

/**
 * Fetch with retry logic
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} attempt - Current attempt number
 * @returns {Promise<object>} Response data
 */
async function fetchWithRetry(url, options, attempt = 1) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        return data;
    } catch (error) {
        console.error(`API request failed (attempt ${attempt}):`, error);

        // Retry logic
        if (attempt < API_CONFIG.retryAttempts) {
            console.log(`Retrying in ${API_CONFIG.retryDelay}ms...`);
            await sleep(API_CONFIG.retryDelay);
            return fetchWithRetry(url, options, attempt + 1);
        }

        throw error;
    }
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// API Methods
// ========================================

/**
 * Get current system status
 * @returns {Promise<object>} Status data
 */
async function getStatus() {
    return await apiGet('getStatus');
}

/**
 * Get all story ideas
 * @param {string} filter - Filter by status ('all', 'approved', 'pending')
 * @returns {Promise<Array>} Story ideas
 */
async function getStoryIdeas(filter = 'all') {
    return await apiGet('getStoryIdeas', { filter });
}

/**
 * Get generation log
 * @param {number} limit - Number of entries to fetch
 * @returns {Promise<Array>} Generation log entries
 */
async function getGenerationLog(limit = 10) {
    return await apiGet('getGenerationLog', { limit });
}

/**
 * Approve a story idea
 * @param {number} id - Story ID
 * @returns {Promise<object>} Response
 */
async function approveIdea(id) {
    return await apiPost('approveIdea', { id });
}

/**
 * Reject a story idea
 * @param {number} id - Story ID
 * @returns {Promise<object>} Response
 */
async function rejectIdea(id) {
    return await apiPost('rejectIdea', { id });
}

/**
 * Trigger manual generation
 * @returns {Promise<object>} Response
 */
async function triggerGeneration() {
    return await apiPost('triggerGeneration');
}

/**
 * Regenerate a specific video
 * @param {string} storyId - Story ID
 * @param {string} language - Language ('bn' or 'en')
 * @returns {Promise<object>} Response
 */
async function regenerateVideo(storyId, language) {
    return await apiPost('regenerateVideo', { storyId, language });
}

/**
 * Generate new story ideas
 * @returns {Promise<object>} Response
 */
async function generateNewIdeas() {
    return await apiPost('generateIdeas');
}

/**
 * Check API connectivity status
 * @returns {Promise<object>} API status
 */
async function checkApiStatus() {
    return await apiGet('checkApiStatus');
}

/**
 * Get Google Sheets URL
 * @returns {Promise<string>} Sheets URL
 */
async function getSheetsUrl() {
    const response = await apiGet('getSheetsUrl');
    return response.url;
}

/**
 * Get Google Drive folder URL
 * @returns {Promise<string>} Drive folder URL
 */
async function getDriveFolderUrl() {
    const response = await apiGet('getDriveFolderUrl');
    return response.url;
}

// ========================================
// Configuration Methods
// ========================================

/**
 * Update API configuration
 * @param {string} webAppUrl - Apps Script Web App URL
 */
function setWebAppUrl(webAppUrl) {
    API_CONFIG.webAppUrl = webAppUrl;

    // Save to localStorage
    localStorage.setItem('shishukotha_webapp_url', webAppUrl);
}

/**
 * Load API configuration from localStorage
 */
function loadApiConfig() {
    const savedUrl = localStorage.getItem('shishukotha_webapp_url');
    if (savedUrl) {
        API_CONFIG.webAppUrl = savedUrl;
    }
}

// Load configuration on script load
// loadApiConfig(); // Commented out to force use of updated hardcoded URL

// Export for use in other scripts (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getStatus,
        getStoryIdeas,
        getGenerationLog,
        approveIdea,
        rejectIdea,
        triggerGeneration,
        regenerateVideo,
        generateNewIdeas,
        checkApiStatus,
        getSheetsUrl,
        getDriveFolderUrl,
        setWebAppUrl
    };
}
