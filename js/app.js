// app.js - Main Application Logic

// Global state
let currentFilter = 'all';
let autoRefreshInterval = null;

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('ShishuKotha Dashboard initialized');

    // Check if Web App URL is configured
    checkConfiguration();

    // Initialize UI
    initializeEventListeners();

    // Load initial data
    await loadDashboardData();

    // Start auto-refresh (every 60 seconds)
    startAutoRefresh();
});

/**
 * Check if Web App URL is configured
 */
function checkConfiguration() {
    const savedUrl = localStorage.getItem('shishukotha_webapp_url');

    if (!savedUrl || savedUrl === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
        // Show configuration prompt
        const url = prompt(
            'Please enter your Google Apps Script Web App URL:\n\n' +
            'To get this URL:\n' +
            '1. Deploy your Apps Script as Web App\n' +
            '2. Copy the deployment URL\n' +
            '3. Paste it here'
        );

        if (url && url.trim()) {
            setWebAppUrl(url.trim());
            showSuccess('Configuration saved! Reloading dashboard...');
            setTimeout(() => location.reload(), 1500);
        } else {
            showError('Web App URL is required. Please configure it to use the dashboard.');
        }
    }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Header buttons
    document.getElementById('refreshBtn').addEventListener('click', handleRefresh);
    document.getElementById('openSheetsBtn').addEventListener('click', handleOpenSheets);

    // Download regenerate buttons
    document.getElementById('bnRegenerateBtn').addEventListener('click', () => handleRegenerate('bn'));
    document.getElementById('enRegenerateBtn').addEventListener('click', () => handleRegenerate('en'));

    // Story ideas
    document.getElementById('generateIdeasBtn').addEventListener('click', handleGenerateIdeas);

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.tab;
            loadStoryIdeas();
        });
    });

    // Control panel
    document.getElementById('manualTriggerBtn').addEventListener('click', handleManualTrigger);
}

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
    showLoading('Loading dashboard data...');

    try {
        // Load data in parallel
        await Promise.all([
            loadStatus(),
            loadStoryIdeas(),
            loadGenerationLog(),
            loadApiStatus(),
            loadQuickLinks()
        ]);

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data. Using offline mode.');

        // Load demo data for offline preview
        // loadDemoData(); // Disabled as per user request to avoid confusion
    }
}

/**
 * Load system status
 */
async function loadStatus() {
    try {
        const status = await getStatus();
        updateStatusDisplay(status);

        if (status.downloads) {
            updateDownloadLinks(status.downloads);
        }
    } catch (error) {
        console.error('Error loading status:', error);
        throw error;
    }
}

/**
 * Load story ideas
 */
async function loadStoryIdeas() {
    try {
        const response = await getStoryIdeas(currentFilter);
        if (response.success && Array.isArray(response.data)) {
            renderStoryIdeas(response.data, currentFilter);
        } else {
            console.error('Invalid story ideas data:', response);
            renderStoryIdeas([], currentFilter);
        }
    } catch (error) {
        console.error('Error loading story ideas:', error);
        throw error;
    }
}

/**
 * Load generation log
 */
async function loadGenerationLog() {
    try {
        const response = await getGenerationLog(10);
        if (response.success && Array.isArray(response.data)) {
            renderGenerationLog(response.data);
        } else {
            console.error('Invalid generation log data:', response);
            renderGenerationLog([]);
        }
    } catch (error) {
        console.error('Error loading generation log:', error);
        throw error;
    }
}

/**
 * Load API status
 */
async function loadApiStatus() {
    try {
        const apiStatus = await checkApiStatus();
        updateApiStatus(apiStatus);
    } catch (error) {
        console.error('Error checking API status:', error);
        // Don't throw, just show checking status
        updateApiStatus(null);
    }
}

/**
 * Load quick links
 */
async function loadQuickLinks() {
    try {
        const [sheetsUrl, driveUrl] = await Promise.all([
            getSheetsUrl(),
            getDriveFolderUrl()
        ]);

        updateQuickLinks(sheetsUrl, driveUrl);
    } catch (error) {
        console.error('Error loading quick links:', error);
        // Don't throw, links are optional
    }
}

// ========================================
// Event Handlers
// ========================================

/**
 * Handle refresh button click
 */
async function handleRefresh() {
    await loadDashboardData();
    showSuccess('Dashboard refreshed');
}

/**
 * Handle open sheets button click
 */
async function handleOpenSheets() {
    try {
        const url = await getSheetsUrl();
        window.open(url, '_blank');
    } catch (error) {
        showError('Failed to open Google Sheets');
    }
}

/**
 * Handle regenerate video
 * @param {string} language - Language code ('bn' or 'en')
 */
async function handleRegenerate(language) {
    const confirmed = confirm(
        `Are you sure you want to regenerate the ${language === 'bn' ? 'Bengali' : 'English'} video?\n\n` +
        'This will create a new version and may take several minutes.'
    );

    if (!confirmed) return;

    showLoading(`Regenerating ${language === 'bn' ? 'Bengali' : 'English'} video...`);

    try {
        const response = await regenerateVideo('current', language);
        hideLoading();

        if (response.success) {
            showSuccess('Video regeneration started! Check back in a few minutes.');
            setTimeout(() => loadDashboardData(), 2000);
        } else {
            showError(response.message || 'Failed to start regeneration');
        }
    } catch (error) {
        hideLoading();
        console.error('Error regenerating video:', error);
        showError('Failed to regenerate video. Please try again.');
    }
}

/**
 * Handle approve idea
 * @param {number} id - Story idea ID
 */
async function handleApproveIdea(id) {
    showLoading('Approving story idea...');

    try {
        const response = await approveIdea(id);
        hideLoading();

        if (response.success) {
            showSuccess('Story idea approved!');
            await loadStoryIdeas();
        } else {
            showError(response.message || 'Failed to approve idea');
        }
    } catch (error) {
        hideLoading();
        console.error('Error approving idea:', error);
        showError('Failed to approve idea. Please try again.');
    }
}

/**
 * Handle reject idea
 * @param {number} id - Story idea ID
 */
async function handleRejectIdea(id) {
    const confirmed = confirm('Are you sure you want to reject this story idea?');
    if (!confirmed) return;

    showLoading('Rejecting story idea...');

    try {
        const response = await rejectIdea(id);
        hideLoading();

        if (response.success) {
            showSuccess('Story idea rejected');
            await loadStoryIdeas();
        } else {
            showError(response.message || 'Failed to reject idea');
        }
    } catch (error) {
        hideLoading();
        console.error('Error rejecting idea:', error);
        showError('Failed to reject idea. Please try again.');
    }
}

/**
 * Handle generate new ideas
 */
async function handleGenerateIdeas() {
    const confirmed = confirm(
        'Generate 10-15 new story ideas?\n\n' +
        'This will use your AI API and add new ideas to the pending list.'
    );

    if (!confirmed) return;

    showLoading('Generating new story ideas...');

    try {
        const response = await generateNewIdeas();
        hideLoading();

        if (response.success) {
            showSuccess(`Generated ${response.count || 'new'} story ideas!`);
            await loadStoryIdeas();
        } else {
            showError(response.message || 'Failed to generate ideas');
        }
    } catch (error) {
        hideLoading();
        console.error('Error generating ideas:', error);
        showError('Failed to generate ideas. Please check your API configuration.');
    }
}

/**
 * Handle manual trigger
 */
async function handleManualTrigger() {
    const confirmed = confirm(
        'Start video generation now?\n\n' +
        'This will generate videos for the next approved story in both Bengali and English.\n' +
        'The process may take 5-10 minutes.'
    );

    if (!confirmed) return;

    showLoading('Starting video generation...');

    try {
        const response = await triggerGeneration();
        hideLoading();

        if (response.success) {
            showSuccess('Video generation started! Monitor the status above.');
            setTimeout(() => loadDashboardData(), 2000);
        } else {
            showError(response.message || 'Failed to start generation');
        }
    } catch (error) {
        hideLoading();
        console.error('Error triggering generation:', error);
        showError('Failed to start generation. Please try again.');
    }
}

// ========================================
// Auto-refresh
// ========================================

/**
 * Start auto-refresh interval
 */
function startAutoRefresh() {
    // Refresh every 60 seconds
    autoRefreshInterval = setInterval(async () => {
        console.log('Auto-refreshing dashboard...');
        try {
            await loadStatus();
            await loadApiStatus();
        } catch (error) {
            console.error('Auto-refresh error:', error);
        }
    }, 60000);
}

/**
 * Stop auto-refresh interval
 */
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// ========================================
// Demo Data (for offline preview)
// ========================================

/**
 * Load demo data for offline preview
 */
function loadDemoData() {
    console.log('Loading demo data for offline preview');

    // Demo status
    updateStatusDisplay({
        status: 'Pending',
        lastGenDate: new Date().toLocaleDateString(),
        currentStory: 'The Honest Woodcutter',
        version: 'v1',
        progress: 0,
        message: 'Offline Mode - Demo Data'
    });

    // Demo downloads
    updateDownloadLinks({
        bengali: {
            title: 'সৎ কাঠুরিয়া (Demo)',
            date: new Date().toLocaleDateString(),
            version: 'v1',
            url: null
        },
        english: {
            title: 'The Honest Woodcutter (Demo)',
            date: new Date().toLocaleDateString(),
            version: 'v1',
            url: null
        }
    });

    // Demo story ideas
    const demoIdeas = [
        {
            sl: 1,
            idea: 'The Honest Woodcutter',
            moral: 'Honesty is always rewarded',
            approved: 'Yes',
            status: 'Pending'
        },
        {
            sl: 2,
            idea: 'The Greedy Dog',
            moral: 'Greed leads to loss',
            approved: 'No',
            status: 'Pending'
        },
        {
            sl: 3,
            idea: 'The Ant and the Grasshopper',
            moral: 'Hard work pays off',
            approved: 'Yes',
            status: 'Pending'
        }
    ];
    renderStoryIdeas(demoIdeas, currentFilter);

    // Demo generation log
    const demoLogs = [
        {
            date: new Date().toLocaleDateString(),
            storyId: 'The Kind Lion',
            language: 'BN, EN',
            status: 'Generated',
            version: 'v1',
            driveLink: '#'
        }
    ];
    renderGenerationLog(demoLogs);

    // Demo API status
    updateApiStatus({
        textApi: 'checking',
        imageApi: 'checking',
        ttsApi: 'checking',
        appsScript: 'offline'
    });
}

// Make handlers available globally for inline event handlers
window.handleApproveIdea = handleApproveIdea;
window.handleRejectIdea = handleRejectIdea;
