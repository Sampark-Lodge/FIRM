/**
 * WebApp.gs - Web App Endpoints for HTML Dashboard
 * Handles all HTTP requests from the frontend dashboard
 */

// ========================================
// WEB APP ENTRY POINTS
// ========================================

/**
 * Handle GET requests
 * @param {object} e - Event object
 * @returns {TextOutput} JSON response
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (!action) {
      return createResponse({ error: 'Action parameter required' });
    }
    
    let result;
    
    switch (action) {
      case 'getStatus':
        result = handleGetStatus();
        break;
      
      case 'getStoryIdeas':
        const filter = e.parameter.filter || 'all';
        result = handleGetStoryIdeas(filter);
        break;
      
      case 'getGenerationLog':
        const limit = parseInt(e.parameter.limit) || 10;
        result = handleGetGenerationLog(limit);
        break;
      
      case 'checkApiStatus':
        result = handleCheckApiStatus();
        break;
      
      case 'getSheetsUrl':
        result = handleGetSheetsUrl();
        break;
      
      case 'getDriveFolderUrl':
        result = handleGetDriveFolderUrl();
        break;
      
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    return createResponse(result);
  } catch (error) {
    return createResponse(handleError(error, 'doGet'));
  }
}

/**
 * Handle POST requests
 * @param {object} e - Event object
 * @returns {TextOutput} JSON response
 */
function doPost(e) {
  try {
    // Handle both JSON and URL-encoded POST data
    let action, data;
    
    if (e.postData.type === 'application/x-www-form-urlencoded') {
      // URL-encoded data (from frontend to avoid CORS preflight)
      action = e.parameter.action;
      data = e.parameter;
    } else {
      // JSON data (fallback for direct API calls)
      const jsonData = JSON.parse(e.postData.contents);
      action = jsonData.action;
      data = jsonData;
    }
    
    if (!action) {
      return createResponse({ error: 'Action parameter required' });
    }
    
    let result;
    
    switch (action) {
      case 'approveIdea':
        result = handleApproveIdea(data.id);
        break;
      
      case 'rejectIdea':
        result = handleRejectIdea(data.id);
        break;
      
      case 'triggerGeneration':
        result = handleTriggerGeneration();
        break;
      
      case 'regenerateVideo':
        result = handleRegenerateVideo(data.storyId, data.language);
        break;
      
      case 'generateIdeas':
        result = handleGenerateIdeas();
        break;
      
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    return createResponse(result);
  } catch (error) {
    return createResponse(handleError(error, 'doPost'));
  }
}

/**
 * Create JSON response
 * @param {object} data - Response data
 * @returns {TextOutput} JSON output
 */
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// GET REQUEST HANDLERS
// ========================================

/**
 * Get current system status
 * @returns {object} Status data
 */
function handleGetStatus() {
  try {
    const logSheet = getSheet(CONFIG.SHEETS.generation_log);
    const data = logSheet.getDataRange().getValues();
    
    let lastGenDate = '--';
    let currentStory = '--';
    let version = 'v1';
    let status = 'Pending';
    let progress = 0;
    let message = 'System ready';
    
    // Get last generation entry
    if (data.length > 1) {
      const lastEntry = data[data.length - 1];
      lastGenDate = lastEntry[0] || '--';
      currentStory = lastEntry[1] || '--';
      status = lastEntry[3] || 'Pending';
      version = lastEntry[5] || 'v1';
      
      if (status === 'Generated') {
        progress = 100;
        message = 'Last generation completed successfully';
      } else if (status === 'Failed') {
        progress = 0;
        message = 'Last generation failed. Check logs for details.';
      }
    }
    
    // Get download links
    const downloads = getLatestDownloads();
    
    return {
      success: true,
      status: status,
      lastGenDate: lastGenDate,
      currentStory: currentStory,
      version: version,
      progress: progress,
      message: message,
      downloads: downloads
    };
  } catch (error) {
    return handleError(error, 'handleGetStatus');
  }
}

/**
 * Get story ideas from sheet
 * @param {string} filter - Filter type ('all', 'approved', 'pending')
 * @returns {object} Story ideas data
 */
function handleGetStoryIdeas(filter) {
  try {
    const sheet = getSheet(CONFIG.SHEETS.story_ideas);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, data: [] };
    }
    
    const ideas = [];
    
    for (let i = 1; i < data.length; i++) {
      const idea = {
        sl: data[i][0],
        idea: data[i][1],
        moral: data[i][2],
        approved: data[i][3],
        status: data[i][4] || 'Pending'
      };
      
      // Apply filter
      if (filter === 'approved' && idea.approved !== 'Yes') continue;
      if (filter === 'pending' && idea.approved === 'Yes') continue;
      
      ideas.push(idea);
    }
    
    return { success: true, data: ideas };
  } catch (error) {
    return handleError(error, 'handleGetStoryIdeas');
  }
}

/**
 * Get generation log
 * @param {number} limit - Number of entries to return
 * @returns {object} Log data
 */
function handleGetGenerationLog(limit) {
  try {
    const sheet = getSheet(CONFIG.SHEETS.generation_log);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, data: [] };
    }
    
    const logs = [];
    const startRow = Math.max(1, data.length - limit);
    
    for (let i = data.length - 1; i >= startRow; i--) {
      logs.push({
        date: data[i][0],
        storyId: data[i][1],
        language: data[i][2],
        status: data[i][3],
        driveLink: data[i][4],
        version: data[i][5]
      });
    }
    
    return { success: true, data: logs };
  } catch (error) {
    return handleError(error, 'handleGetGenerationLog');
  }
}

/**
 * Check API connectivity status
 * @returns {object} API status
 */
function handleCheckApiStatus() {
  try {
    const textApiKey = getConfigValue('Text_API_Key');
    const imageApiKey = getConfigValue('Image_API_Key');
    const ttsApiKey = getConfigValue('TTS_API_Key');
    
    return {
      success: true,
      textApi: textApiKey ? 'online' : 'offline',
      imageApi: imageApiKey ? 'online' : 'offline',
      ttsApi: ttsApiKey ? 'online' : 'offline',
      appsScript: 'online'
    };
  } catch (error) {
    return handleError(error, 'handleCheckApiStatus');
  }
}

/**
 * Get Google Sheets URL
 * @returns {object} Sheets URL
 */
function handleGetSheetsUrl() {
  try {
    const ss = getSpreadsheet();
    return {
      success: true,
      url: ss.getUrl()
    };
  } catch (error) {
    return handleError(error, 'handleGetSheetsUrl');
  }
}

/**
 * Get Drive folder URL
 * @returns {object} Drive folder URL
 */
function handleGetDriveFolderUrl() {
  try {
    if (!CONFIG.DRIVE_FOLDER_ID || CONFIG.DRIVE_FOLDER_ID === 'YOUR_DRIVE_FOLDER_ID_HERE') {
      return {
        success: true,
        url: 'https://drive.google.com'
      };
    }
    
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    return {
      success: true,
      url: folder.getUrl()
    };
  } catch (error) {
    return handleError(error, 'handleGetDriveFolderUrl');
  }
}

// ========================================
// POST REQUEST HANDLERS
// ========================================

/**
 * Approve a story idea
 * @param {number} id - Story ID
 * @returns {object} Response
 */
function handleApproveIdea(id) {
  try {
    const sheet = getSheet(CONFIG.SHEETS.story_ideas);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.getRange(i + 1, 4).setValue('Yes');
        logMessage(`Story idea #${id} approved`, 'INFO');
        return {
          success: true,
          message: 'Story idea approved successfully'
        };
      }
    }
    
    return {
      success: false,
      message: 'Story idea not found'
    };
  } catch (error) {
    return handleError(error, 'handleApproveIdea');
  }
}

/**
 * Reject a story idea
 * @param {number} id - Story ID
 * @returns {object} Response
 */
function handleRejectIdea(id) {
  try {
    const sheet = getSheet(CONFIG.SHEETS.story_ideas);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.getRange(i + 1, 4).setValue('No');
        logMessage(`Story idea #${id} rejected`, 'INFO');
        return {
          success: true,
          message: 'Story idea rejected'
        };
      }
    }
    
    return {
      success: false,
      message: 'Story idea not found'
    };
  } catch (error) {
    return handleError(error, 'handleRejectIdea');
  }
}

/**
 * Trigger manual generation
 * @returns {object} Response
 */
function handleTriggerGeneration() {
  try {
    // Run in background (Apps Script will handle async execution)
    const result = runFullPipeline();
    
    return {
      success: result.success,
      message: result.message || 'Generation started'
    };
  } catch (error) {
    return handleError(error, 'handleTriggerGeneration');
  }
}

/**
 * Regenerate a specific video
 * @param {string} storyId - Story ID
 * @param {string} language - Language code
 * @returns {object} Response
 */
function handleRegenerateVideo(storyId, language) {
  try {
    logMessage(`Regenerating video: ${storyId} (${language})`, 'INFO');
    
    // Get the story from log or ideas
    let storyData = findStoryById(storyId);
    
    if (!storyData) {
      return {
        success: false,
        message: 'Story not found'
      };
    }
    
    // Regenerate specific language
    const result = regenerateStoryVideo(storyData, language);
    
    return {
      success: result.success,
      message: result.message || 'Video regeneration started'
    };
  } catch (error) {
    return handleError(error, 'handleRegenerateVideo');
  }
}

/**
 * Generate new story ideas
 * @returns {object} Response
 */
function handleGenerateIdeas() {
  try {
    const count = generateStoryIdeas();
    
    return {
      success: true,
      count: count,
      message: `Generated ${count} new story ideas`
    };
  } catch (error) {
    return handleError(error, 'handleGenerateIdeas');
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get latest download links
 * @returns {object} Download links for both languages
 */
function getLatestDownloads() {
  try {
    const logSheet = getSheet(CONFIG.SHEETS.generation_log);
    const data = logSheet.getDataRange().getValues();
    
    let bengaliData = null;
    let englishData = null;
    
    // Search from bottom up for latest entries
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][2] && data[i][2].includes('BN') && !bengaliData) {
        bengaliData = data[i];
      }
      if (data[i][2] && data[i][2].includes('EN') && !englishData) {
        englishData = data[i];
      }
      if (bengaliData && englishData) break;
    }
    
    return {
      bengali: bengaliData ? {
        title: bengaliData[1] + ' (বাংলা)',
        date: bengaliData[0],
        version: bengaliData[5],
        url: bengaliData[4]
      } : null,
      english: englishData ? {
        title: englishData[1] + ' (English)',
        date: englishData[0],
        version: englishData[5],
        url: englishData[4]
      } : null
    };
  } catch (error) {
    logMessage('Error getting downloads: ' + error, 'ERROR');
    return { bengali: null, english: null };
  }
}

/**
 * Find story by ID
 * @param {string} storyId - Story ID
 * @returns {object} Story data
 */
function findStoryById(storyId) {
  // Implementation depends on how you want to identify stories
  // This is a placeholder
  return null;
}
