// app.js - Control Room Application Logic
// Global state
let currentFilter = 'all';
let autoRefreshInterval = null;
let videoPollingInterval = null;
// ========================================
// Initialization
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('ShishuKotha Control Room initialized');
    // Initialize UI
    initializeEventListeners();
    // Load initial data
    await loadDashboardData();
    // Start auto-refresh (every 30 seconds)
    startAutoRefresh();
    // Start video status polling (every 10 seconds)
    startVideoPolling();
});
/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Header
    document.getElementById('refreshBtn').addEventListener('click', handleRefresh);
    // Control buttons
    document.getElementById('startPipelineBtn').addEventListener('click', handleStartPipeline);
    document.getElementById('startVideoOnlyBtn').addEventListener('click', handleStartVideoOnly);
    document.getElementById('generateIdeasBtn').addEventListener('click', handleGenerateIdeas);
    // Download buttons
    document.getElementById('bnRegenerateBtn').addEventListener('click', () => handleRegenerate('bn'));
    document.getElementById('enRegenerateBtn').addEventListener('click', () => handleRegenerate('en'));
    // Error dismiss
    document.getElementById('dismissError')?.addEventListener('click', hideError);
}
/**
 * Load all dashboard data
 */
async function loadDashboardData() {
    showLoading('Loading control room data...');
    try {
        await Promise.all([
            loadStatus(),
            loadStoryQueue(),
            loadGenerationLog(),
            loadApiStatus(),
            loadQuickLinks()
        ]);
        updateConnectionStatus(true);
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Error loading dashboard:', error);
        updateConnectionStatus(false);
        showError('Failed to connect to backend. Check your Apps Script deployment.');
    }
}
// ========================================
// Status Loading
// ========================================
async function loadStatus() {
    try {
        const status = await getStatus();
        updatePipelineStatus(status);
        updateVideoProgress(status.videoState);
        updateDownloads(status.downloads);
    } catch (error) {
        console.error('Error loading status:', error);
        throw error;
    }
}
function updateConnectionStatus(connected) {
    const el = document.getElementById('connectionStatus');
    if (connected) {
        el.innerHTML = '<span class="status-dot online"></span> Connected';
        el.classList.add('connected');
    } else {
        el.innerHTML = '<span class="status-dot offline"></span> Disconnected';
        el.classList.remove('connected');
    }
}
function updatePipelineStatus(status) {
    // Update current task
    const taskEl = document.getElementById('currentTask');
    if (status.videoState) {
        taskEl.innerHTML = `<p><strong>Active:</strong> Generating ${status.videoState.language === 'bn' ? 'Bengali' : 'English'} video for "${status.videoState.storyFolderName}"</p>`;
        document.getElementById('liveIndicator').classList.add('active');
    } else if (status.status === 'Pending') {
        taskEl.innerHTML = '<p>No active task. Ready to generate.</p>';
        document.getElementById('liveIndicator').classList.remove('active');
    } else {
        taskEl.innerHTML = `<p>Last: ${status.currentStory || '--'}</p>`;
    }
    // Update stage indicators (simplified)
    updateStageStatus('stageStory', status.status);
    updateStageStatus('stageMedia', status.status);
    updateStageStatus('stageVideo', status.videoState ? 'active' : 'idle');
}
function updateStageStatus(stageId, status) {
    const el = document.getElementById(stageId);
    const statusEl = document.getElementById(stageId + 'Status');
    if (!el || !statusEl) return;
    el.classList.remove('active', 'complete', 'error');
    if (status === 'active' || status === 'Generating Video') {
        el.classList.add('active');
        statusEl.textContent = 'Active';
    } else if (status === 'Success' || status === 'Generated') {
        el.classList.add('complete');
        statusEl.textContent = 'Done';
    } else if (status === 'Failed') {
        el.classList.add('error');
        statusEl.textContent = 'Error';
    } else {
        statusEl.textContent = 'Idle';
    }
}
function updateVideoProgress(videoState) {
    const progressFill = document.getElementById('videoProgressFill');
    const progressMessage = document.getElementById('videoProgressMessage');
    const storyName = document.getElementById('videoStoryName');
    const sceneProgress = document.getElementById('videoSceneProgress');
    const languageBadge = document.getElementById('videoLanguageBadge');
    if (videoState) {
        const current = videoState.currentScene - 1;
        const total = videoState.totalScenes;
        const percent = total > 0 ? Math.round((current / total) * 100) : 0;
        progressFill.style.width = percent + '%';
        storyName.textContent = videoState.storyFolderName || '--';
        sceneProgress.textContent = `${current} / ${total}`;
        languageBadge.textContent = videoState.language === 'bn' ? 'Bengali' : 'English';
        languageBadge.classList.add('active');
        progressMessage.textContent = videoState.status === 'running'
            ? `Animating scene ${videoState.currentScene}...`
            : 'Processing...';
    } else {
        progressFill.style.width = '0%';
        storyName.textContent = '--';
        sceneProgress.textContent = '-- / --';
        languageBadge.textContent = '--';
        languageBadge.classList.remove('active');
        progressMessage.textContent = 'No video generation in progress';
    }
}
function updateDownloads(downloads) {
    if (!downloads) return;
    if (downloads.bengali) {
        document.getElementById('bnVideoTitle').textContent = downloads.bengali.title || 'Available';
        const bnBtn = document.getElementById('bnDownloadBtn');
        if (downloads.bengali.url) {
            bnBtn.href = downloads.bengali.url;
            bnBtn.classList.remove('disabled');
        }
    }
    if (downloads.english) {
        document.getElementById('enVideoTitle').textContent = downloads.english.title || 'Available';
        const enBtn = document.getElementById('enDownloadBtn');
        if (downloads.english.url) {
            enBtn.href = downloads.english.url;
            enBtn.classList.remove('disabled');
        }
    }
}
// ========================================
// Story Queue
// ========================================
async function loadStoryQueue() {
    try {
        const response = await getStoryIdeas('approved');
        renderStoryQueue(response.data || []);
    } catch (error) {
        console.error('Error loading story queue:', error);
    }
}
function renderStoryQueue(ideas) {
    const container = document.getElementById('storyQueue');
    if (!ideas || ideas.length === 0) {
        container.innerHTML = '<p class="empty-message">No approved stories. Add ideas in Google Sheets.</p>';
        return;
    }
    container.innerHTML = ideas.slice(0, 5).map(idea => `
        <div class="queue-item">
            <span class="queue-number">#${idea.id || idea.sl}</span>
            <span class="queue-title">${idea.idea}</span>
            <span class="queue-moral">${idea.moral}</span>
        </div>
    `).join('');
}
// ========================================
// API Status
// ========================================
async function loadApiStatus() {
    try {
        const status = await checkApiStatus();
        updateApiStatusGrid(status);
        document.getElementById('backendStatusBadge').textContent = 'Online';
        document.getElementById('backendStatusBadge').classList.add('online');
    } catch (error) {
        document.getElementById('backendStatusBadge').textContent = 'Offline';
        document.getElementById('backendStatusBadge').classList.add('offline');
    }
}
function updateApiStatusGrid(status) {
    if (!status) return;
    setApiBadge('textApiStatusBadge', status.textApi);
    setApiBadge('imageApiStatusBadge', status.imageApi || 'online'); // Pollinations always online
    setApiBadge('ttsApiStatusBadge', status.ttsApi);
    setApiBadge('videoApiStatusBadge', 'online'); // Kling configured
}
function setApiBadge(id, status) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('online', 'offline', 'checking');
    if (status === 'online') {
        el.textContent = 'Online';
        el.classList.add('online');
    } else if (status === 'offline') {
        el.textContent = 'Offline';
        el.classList.add('offline');
    } else {
        el.textContent = 'Checking...';
        el.classList.add('checking');
    }
}
// ========================================
// Generation Log
// ========================================
async function loadGenerationLog() {
    try {
        const response = await getGenerationLog(5);
        renderGenerationLog(response.data || []);
    } catch (error) {
        console.error('Error loading generation log:', error);
    }
}
function renderGenerationLog(logs) {
    const tbody = document.getElementById('logTableBody');
    if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">No generation history yet</td></tr>';
        return;
    }
    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${log.date || '--'}</td>
            <td>${log.title || log.storyId || '--'}</td>
            <td><span class="status-badge ${log.enStatus === 'Success' ? 'success' : 'pending'}">${log.enStatus || '--'}</span></td>
            <td><span class="status-badge ${log.bnStatus === 'Success' ? 'success' : 'pending'}">${log.bnStatus || '--'}</span></td>
            <td><span class="status-badge">--</span></td>
        </tr>
    `).join('');
}
// ========================================
// Quick Links
// ========================================
async function loadQuickLinks() {
    try {
        const [sheetsUrl, driveUrl] = await Promise.all([
            getSheetsUrl(),
            getDriveFolderUrl()
        ]);
        document.getElementById('openSheetsBtn').href = sheetsUrl || '#';
        document.getElementById('openDriveBtn').href = driveUrl || '#';
    } catch (error) {
        console.error('Error loading quick links:', error);
    }
}
// ========================================
// Event Handlers
// ========================================
async function handleRefresh() {
    await loadDashboardData();
    showToast('Dashboard refreshed', 'success');
}
async function handleStartPipeline() {
    if (!confirm('Start full pipeline (Story → Media → Video)?')) return;
    showLoading('Starting pipeline...');
    try {
        const response = await triggerGeneration();
        hideLoading();
        if (response.success) {
            showToast('Pipeline started! Monitor progress above.', 'success');
            setTimeout(() => loadDashboardData(), 2000);
        } else {
            showError(response.message || 'Failed to start pipeline');
        }
    } catch (error) {
        hideLoading();
        showError('Failed to start pipeline: ' + error.message);
    }
}
async function handleStartVideoOnly() {
    const storyName = prompt('Enter story folder name (e.g., "the_greedy_dog"):');
    if (!storyName) return;
    const language = prompt('Language? Enter "en" for English or "bn" for Bengali:', 'bn');
    if (!language) return;
    showLoading('Starting video generation...');
    try {
        const response = await regenerateVideo(storyName, language);
        hideLoading();
        if (response.success) {
            showToast('Video generation started!', 'success');
            setTimeout(() => loadDashboardData(), 2000);
        } else {
            showError(response.message || 'Failed to start video generation');
        }
    } catch (error) {
        hideLoading();
        showError('Failed to start video: ' + error.message);
    }
}
async function handleRegenerate(language) {
    if (!confirm(`Regenerate ${language === 'bn' ? 'Bengali' : 'English'} video?`)) return;
    showLoading('Starting regeneration...');
    try {
        const response = await regenerateVideo('current', language);
        hideLoading();
        if (response.success) {
            showToast('Video regeneration started!', 'success');
        } else {
            showError(response.message || 'Failed to regenerate');
        }
    } catch (error) {
        hideLoading();
        showError('Regeneration failed: ' + error.message);
    }
}
async function handleGenerateIdeas() {
    if (!confirm('Generate new story ideas?')) return;
    showLoading('Generating ideas...');
    try {
        const response = await generateNewIdeas();
        hideLoading();
        if (response.success) {
            showToast('Ideas generated!', 'success');
            await loadStoryQueue();
        } else {
            showError(response.message || 'Failed to generate ideas');
        }
    } catch (error) {
        hideLoading();
        showError('Failed to generate ideas: ' + error.message);
    }
}
// ========================================
// Error Display
// ========================================
function showError(message) {
    const section = document.getElementById('alertsSection');
    const msgEl = document.getElementById('errorMessage');
    const timeEl = document.getElementById('errorTime');
    msgEl.textContent = message;
    timeEl.textContent = new Date().toLocaleTimeString();
    section.style.display = 'block';
}
function hideError() {
    document.getElementById('alertsSection').style.display = 'none';
}
// ========================================
// Toast & Loading
// ========================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMessage');
    icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    msg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
function showLoading(message = 'Processing...') {
    document.getElementById('loadingMessage').textContent = message;
    document.getElementById('loadingOverlay').classList.add('show');
}
function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}
// ========================================
// Auto-refresh & Polling
// ========================================
function startAutoRefresh() {
    autoRefreshInterval = setInterval(async () => {
        try {
            await loadStatus();
            await loadApiStatus();
        } catch (error) {
            console.error('Auto-refresh error:', error);
        }
    }, 30000);
}
function startVideoPolling() {
    videoPollingInterval = setInterval(async () => {
        try {
            const status = await getStatus();
            if (status.videoState) {
                updateVideoProgress(status.videoState);
            }
        } catch (error) {
            // Silently fail polling
        }
    }, 10000);
}
