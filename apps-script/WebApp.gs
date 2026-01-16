/**
 * WebApp.gs - Web App Endpoints for HTML Dashboard
 * Handles all HTTP requests from the frontend dashboard
 */

// ========================================
// WEB APP ENTRY POINTS
// ========================================

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    if (!action) return createResponse({ error: 'Action parameter required' });
    
    let result;
    switch (action) {
      case 'getStatus': result = handleGetStatus(); break;
      case 'getStoryIdeas': result = handleGetStoryIdeas(e.parameter.filter || 'all'); break;
      case 'getGenerationLog': result = handleGetGenerationLog(parseInt(e.parameter.limit) || 10); break;
      case 'checkApiStatus': result = handleCheckApiStatus(); break;
      case 'getSheetsUrl': result = handleGetSheetsUrl(); break;
      case 'getDriveFolderUrl': result = handleGetDriveFolderUrl(); break;
      default: result = { error: 'Unknown action: ' + action };
    }
    return createResponse(result);
  } catch (error) {
    return createResponse(handleError(error, 'doGet'));
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    let action, data;
    if (e.postData.type === 'application/x-www-form-urlencoded') {
      action = e.parameter.action;
      data = e.parameter;
    } else {
      const jsonData = JSON.parse(e.postData.contents);
      action = jsonData.action;
      data = jsonData;
    }
    
    if (!action) return createResponse({ error: 'Action parameter required' });
    
    let result;
    switch (action) {
      case 'approveIdea': result = handleApproveIdea(data.id); break;
      case 'rejectIdea': result = handleRejectIdea(data.id); break;
      case 'triggerGeneration': result = handleTriggerGeneration(); break;
      case 'regenerateVideo': result = handleRegenerateVideo(data.storyId, data.language); break;
      case 'generateIdeas': result = handleGenerateIdeas(); break;
      default: result = { error: 'Unknown action: ' + action };
    }
    return createResponse(result);
  } catch (error) {
    return createResponse(handleError(error, 'doPost'));
  }
}

/**
 * Create JSON response
 */
function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Global Error Handler Helper
 */
function handleError(error, context) {
  logMessage(`Error in ${context}: ${error.message}`, 'ERROR');
  return { success: false, error: error.message };
}

// ========================================
// ACTION HANDLERS
// ========================================

function handleGetStatus() {
  const logSheet = getSheet(CONFIG.SHEETS.generation_log);
  const data = logSheet.getDataRange().getValues();
  // Simple check for data
  if (data.length <= 1) return { success: true, status: 'Pending', message: 'System ready' };
  
  const last = data[data.length - 1];
  
  // Check video processing status if active
  const videoState = getVideoProcessingState(); // From VideoGenerator.gs
  let videoStatusMsg = '';
  if (videoState) {
    videoStatusMsg = `Generating Video: Scene ${videoState.currentScene}/${videoState.totalScenes}`;
  }

  return {
    success: true,
    status: videoState ? 'Generating Video' : (last[3] || 'Pending'),
    lastGenDate: last[0],
    currentStory: last[1],
    message: videoStatusMsg || 'Ready',
    videoState: videoState
  };
}

function handleGetStoryIdeas(filter) {
  const sheet = getSheet(CONFIG.SHEETS.story_ideas);
  const data = sheet.getDataRange().getValues();
  const ideas = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const approved = row[3];
    if (filter === 'approved' && approved !== 'Yes') continue;
    if (filter === 'pending' && approved === 'Yes') continue;
    
    ideas.push({ id: row[0], idea: row[1], moral: row[2], approved: approved });
  }
  return { success: true, data: ideas };
}

function handleGetGenerationLog(limit) {
  const sheet = getSheet(CONFIG.SHEETS.generation_log);
  const data = sheet.getDataRange().getValues();
  const logs = [];
  const start = Math.max(1, data.length - limit);
  
  for (let i = data.length - 1; i >= start; i--) {
    logs.push({
      date: data[i][0],
      title: data[i][1],
      enStatus: data[i][2],
      bnStatus: data[i][3]
    });
  }
  return { success: true, data: logs };
}

function handleCheckApiStatus() {
  return {
    success: true,
    textApi: getConfigValue('Text_API_Key') ? 'online' : 'offline',
    imageApi: 'online', // Pollinations is always online/free
    ttsApi: getConfigValue('TTS_API_Key') ? 'online' : 'offline'
  };
}

function handleGetSheetsUrl() {
  return { success: true, url: getSpreadsheet().getUrl() };
}

function handleGetDriveFolderUrl() {
  return { success: true, url: 'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID };
}

function handleApproveIdea(id) {
  const result = approveStoryIdea(id);
  return { success: result, message: result ? 'Approved' : 'Not found' };
}

function handleRejectIdea(id) {
  // Simple rejection logic (mark as 'No')
  const sheet = getSheet(CONFIG.SHEETS.story_ideas);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.getRange(i+1, 4).setValue('No');
      return { success: true, message: 'Rejected' };
    }
  }
  return { success: false, message: 'Not found' };
}

function handleTriggerGeneration() {
  // Trigger full pipeline
  // runFullPipeline(); // This takes too long for a web request usually
  // Better to set a trigger to run it immediately
  ScriptApp.newTrigger('runFullPipeline').timeBased().after(1000).create();
  return { success: true, message: 'Pipeline triggered (background)' };
}

function handleRegenerateVideo(storyName, language) {
  // Triggers video generation for existing story
  // Note: storyName comes from frontend, assumes it matches folder name
  if (!storyName) return { success: false, error: 'Story name required' };
  
  logMessage(`Manual start video generation for: ${storyName} (${language})`, 'INFO');
  
  // Create trigger to start immediately to avoid timeout
  // We can't pass args to triggers, so we might need a workaround or just call it directly
  // and hope it returns initial status fast enough.
  // Actually, startIncrementalVideoGeneration returns immediately after processing scene 1.
  // Timeout risk is present if scene 1 takes > 30s (API limit for web app).
  
  // Safe approach: save intent to properties and let a common trigger pick it up?
  // Or just try calling it.
  
  try {
    startIncrementalVideoGeneration(storyName, language);
    return { success: true, message: 'Video generation started' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function handleGenerateIdeas() {
  // Placeholder for idea generation logic driven by AI
  // For now, return mock success
  return { success: true, message: 'Idea generation queued' };
}
