// ui.js - UI Rendering Functions

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

/**
 * Show loading overlay
 * @param {string} message - Loading message
 */
function showLoading(message = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingMessage = document.getElementById('loadingMessage');

    loadingMessage.textContent = message;
    overlay.classList.add('show');
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('show');
}

/**
 * Update status section
 * @param {object} status - Status data
 */
function updateStatusDisplay(status) {
    // Update status badge
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.textContent = status.status || 'Unknown';
    statusBadge.className = 'status-badge ' + (status.status || 'pending').toLowerCase();

    // Update status values
    document.getElementById('lastGenDate').textContent = status.lastGenDate || '--';
    document.getElementById('currentStory').textContent = status.currentStory || '--';
    document.getElementById('currentVersion').textContent = status.version || 'v1';

    // Update progress bar
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = (status.progress || 0) + '%';

    // Update status message
    document.getElementById('statusMessage').textContent = status.message || 'System ready';
}

/**
 * Update download links
 * @param {object} downloads - Download data
 */
function updateDownloadLinks(downloads) {
    // Bengali video
    if (downloads.bengali) {
        document.getElementById('bnTitle').textContent = downloads.bengali.title || 'No video available';
        document.getElementById('bnMeta').textContent = downloads.bengali.date || '--';
        document.getElementById('bnVersion').textContent = downloads.bengali.version || 'v1';

        const bnDownloadBtn = document.getElementById('bnDownloadBtn');
        if (downloads.bengali.url) {
            bnDownloadBtn.href = downloads.bengali.url;
            bnDownloadBtn.classList.remove('disabled');
        } else {
            bnDownloadBtn.href = '#';
            bnDownloadBtn.classList.add('disabled');
        }
    }

    // English video
    if (downloads.english) {
        document.getElementById('enTitle').textContent = downloads.english.title || 'No video available';
        document.getElementById('enMeta').textContent = downloads.english.date || '--';
        document.getElementById('enVersion').textContent = downloads.english.version || 'v1';

        const enDownloadBtn = document.getElementById('enDownloadBtn');
        if (downloads.english.url) {
            enDownloadBtn.href = downloads.english.url;
            enDownloadBtn.classList.remove('disabled');
        } else {
            enDownloadBtn.href = '#';
            enDownloadBtn.classList.add('disabled');
        }
    }
}

/**
 * Render story ideas
 * @param {Array} ideas - Story ideas array
 * @param {string} filter - Filter type
 */
function renderStoryIdeas(ideas, filter = 'all') {
    const ideasGrid = document.getElementById('ideasGrid');

    if (!ideas || ideas.length === 0) {
        ideasGrid.innerHTML = `
            <div class="loading-placeholder">
                <p>No story ideas found</p>
            </div>
        `;
        return;
    }

    // Filter ideas based on selected tab
    let filteredIdeas = ideas;
    if (filter === 'approved') {
        filteredIdeas = ideas.filter(idea => idea.approved === 'Yes');
    } else if (filter === 'pending') {
        filteredIdeas = ideas.filter(idea => idea.approved !== 'Yes');
    }

    if (filteredIdeas.length === 0) {
        ideasGrid.innerHTML = `
            <div class="loading-placeholder">
                <p>No ${filter} ideas found</p>
            </div>
        `;
        return;
    }

    // Render idea cards
    ideasGrid.innerHTML = filteredIdeas.map(idea => `
        <div class="idea-card" data-id="${idea.sl}">
            <div class="idea-header">
                <span class="idea-number">#${idea.sl}</span>
                <span class="idea-status ${idea.approved === 'Yes' ? 'approved' : 'pending'}">
                    ${idea.approved === 'Yes' ? 'Approved' : 'Pending'}
                </span>
            </div>
            <div class="idea-content">
                <h3>${idea.idea}</h3>
                <p class="idea-moral">Moral: ${idea.moral}</p>
            </div>
            <div class="idea-actions">
                ${idea.approved !== 'Yes' ? `
                    <button class="btn btn-approve" onclick="handleApproveIdea(${idea.sl})">
                        <span class="icon">✓</span>
                        Approve
                    </button>
                    <button class="btn btn-reject" onclick="handleRejectIdea(${idea.sl})">
                        <span class="icon">✗</span>
                        Reject
                    </button>
                ` : `
                    <span style="color: #10b981; font-size: 0.875rem;">✓ Ready for generation</span>
                `}
            </div>
        </div>
    `).join('');
}

/**
 * Render generation log
 * @param {Array} logs - Generation log entries
 */
function renderGenerationLog(logs) {
    const logTableBody = document.getElementById('logTableBody');

    if (!logs || logs.length === 0) {
        logTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    <span>No generation history available</span>
                </td>
            </tr>
        `;
        return;
    }

    logTableBody.innerHTML = logs.map(log => `
        <tr>
            <td>${log.date}</td>
            <td>${log.storyId}</td>
            <td>
                <span class="language-badge bengali" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">BN</span>
                <span class="language-badge english" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">EN</span>
            </td>
            <td>
                <span class="idea-status ${log.status.toLowerCase()}">${log.status}</span>
            </td>
            <td>${log.version}</td>
            <td>
                ${log.driveLink ? `
                    <a href="${log.driveLink}" target="_blank" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.75rem;">
                        View
                    </a>
                ` : '--'}
            </td>
        </tr>
    `).join('');
}

/**
 * Update API status indicators
 * @param {object} apiStatus - API status object
 */
function updateApiStatus(apiStatus) {
    const statusMap = {
        online: 'online',
        offline: 'offline',
        checking: 'checking'
    };

    // Update individual API statuses
    const textApiStatus = document.getElementById('textApiStatus');
    const imageApiStatus = document.getElementById('imageApiStatus');
    const ttsApiStatus = document.getElementById('ttsApiStatus');
    const appsScriptStatus = document.getElementById('appsScriptStatus');

    if (apiStatus) {
        textApiStatus.className = 'status-dot ' + (statusMap[apiStatus.textApi] || 'checking');
        imageApiStatus.className = 'status-dot ' + (statusMap[apiStatus.imageApi] || 'checking');
        ttsApiStatus.className = 'status-dot ' + (statusMap[apiStatus.ttsApi] || 'checking');
        appsScriptStatus.className = 'status-dot ' + (statusMap[apiStatus.appsScript] || 'checking');
    } else {
        // Default to checking status
        [textApiStatus, imageApiStatus, ttsApiStatus, appsScriptStatus].forEach(el => {
            el.className = 'status-dot checking';
        });
    }
}

/**
 * Update quick links
 * @param {string} sheetsUrl - Google Sheets URL
 * @param {string} driveUrl - Google Drive folder URL
 */
function updateQuickLinks(sheetsUrl, driveUrl) {
    if (sheetsUrl) {
        document.getElementById('sheetsLink').href = sheetsUrl;
        document.getElementById('openSheetsBtn').onclick = () => window.open(sheetsUrl, '_blank');
    }

    if (driveUrl) {
        document.getElementById('driveLink').href = driveUrl;
    }
}

/**
 * Format date string
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateStr;
    }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    showToast('❌ ' + message, 5000);
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
    showToast('✓ ' + message, 3000);
}
