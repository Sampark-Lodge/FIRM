/**
 * Scheduler.gs - Daily Automation and Triggers
 * Handles scheduled generation and workflow orchestration
 */

// ========================================
// TRIGGER SETUP
// ========================================

/**
 * Setup daily trigger for automated generation
 * Run this function once to install the daily trigger
 */
function setupDailyTrigger() {
  // Delete existing triggers to avoid duplicates
  deleteTriggers('dailyGenerationJob');
  
  // Create new daily trigger at 06:00 AM IST
  ScriptApp.newTrigger('dailyGenerationJob')
    .timeBased()
    .atHour(CONFIG.TRIGGER_TIME_HOUR)
    .everyDays(1)
    .inTimezone('Asia/Kolkata')
    .create();
  
  logMessage('Daily trigger installed successfully at 06:00 AM IST', 'INFO');
  Logger.log('✓ Daily trigger installed at 06:00 AM IST');
}

/**
 * Delete existing triggers by function name
 * @param {string} functionName - Name of the function
 */
function deleteTriggers(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
    }
  }
}

/**
 * Remove all triggers (for cleanup)
 */
function removeAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  
  for (const trigger of triggers) {
    ScriptApp.deleteTrigger(trigger);
  }
  
  Logger.log('All triggers removed');
}

// ========================================
// DAILY GENERATION JOB
// ========================================

/**
 * Main daily generation job
 * This function is called by the daily trigger
 */
function dailyGenerationJob() {
  logMessage('=== Daily Generation Job Started ===', 'INFO');
  
  try {
    // Check if generation already done today
    if (isGeneratedToday()) {
      logMessage('Generation already completed today. Skipping.', 'INFO');
      return {
        success: true,
        message: 'Already generated today',
        skipped: true
      };
    }
    
    // Run full pipeline
    const result = runFullPipeline();
    
    logMessage(`=== Daily Generation Job ${result.success ? 'Completed' : 'Failed'} ===`, 
      result.success ? 'INFO' : 'ERROR');
    
    return result;
  } catch (error) {
    logMessage('Daily generation job error: ' + error, 'ERROR');
    return handleError(error, 'dailyGenerationJob');
  }
}

/**
 * Check if generation already completed today
 * @returns {boolean} True if already generated
 */
function isGeneratedToday() {
  const sheet = getSheet(CONFIG.SHEETS.generation_log);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return false;
  
  const today = getTodayDate();
  const lastEntry = data[data.length - 1];
  const lastDate = lastEntry[0];
  
  return lastDate === today;
}

// ========================================
// FULL PIPELINE EXECUTION
// ========================================

/**
 * Run complete video generation pipeline
 * @returns {object} Execution result
 */
function runFullPipeline() {
  logMessage('Starting full generation pipeline', 'INFO');
  
  try {
    // Step 1: Select next story
    const story = selectNextStory();
    
    if (!story) {
      return {
        success: false,
        message: 'No approved stories available. Please approve story ideas first.'
      };
    }
    
    logMessage(`Selected story: ${story.idea}`, 'INFO');
    
    // Step 2: Expand story
    const expandedStory = expandStory(story.idea, story.moral);
    
    if (!expandedStory || !expandedStory.scenes || expandedStory.scenes.length === 0) {
      throw new Error('Story expansion failed');
    }
    
    // Step 3: Generate English version
    logMessage('Generating English version...', 'INFO');
    const englishPackage = createMediaPackage(expandedStory, 'en');
    
    if (!englishPackage.success) {
      throw new Error('English media generation failed');
    }
    
    // Step 4: Generate Bengali version
    logMessage('Generating Bengali version...', 'INFO');
    const bengaliStory = translateToBengali(expandedStory);
    const bengaliPackage = createMediaPackage(bengaliStory, 'bn');
    
    if (!bengaliPackage.success) {
      throw new Error('Bengali media generation failed');
    }
    
    // Step 5: Create video assembly instructions
    const enAssembly = createVideoAssemblyInstructions(englishPackage);
    const bnAssembly = createVideoAssemblyInstructions(bengaliPackage);
    
    // Step 6: Update generation log
    updateGenerationLog({
      storyId: story.idea,
      englishUrl: enAssembly.instructionsUrl,
      bengaliUrl: bnAssembly.instructionsUrl,
      status: 'Generated',
      version: 'v1'
    });
    
    // Step 7: Mark story as used
    markStoryAsGenerated(story.sl);
    
    logMessage('Pipeline completed successfully', 'INFO');
    
    return {
      success: true,
      message: 'Videos generated successfully',
      story: story.idea,
      englishUrl: enAssembly.instructionsUrl,
      bengaliUrl: bnAssembly.instructionsUrl
    };
  } catch (error) {
    // Log failure
    updateGenerationLog({
      storyId: 'Unknown',
      englishUrl: null,
      bengaliUrl: null,
      status: 'Failed',
      version: 'v1',
      error: error.message
    });
    
    return handleError(error, 'runFullPipeline');
  }
}

// ========================================
// STORY SELECTION
// ========================================

/**
 * Select next approved story for generation
 * @returns {object} Story object or null
 */
function selectNextStory() {
  const sheet = getSheet(CONFIG.SHEETS.story_ideas);
  const data = sheet.getDataRange().getValues();
  
  // Find first approved story that hasn't been generated
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === 'Yes' && data[i][4] !== 'Generated') {
      return {
        sl: data[i][0],
        idea: data[i][1],
        moral: data[i][2],
        approved: data[i][3],
        status: data[i][4],
        rowIndex: i + 1
      };
    }
  }
  
  return null;
}

/**
 * Mark story as generated
 * @param {number} sl - Story serial number
 */
function markStoryAsGenerated(sl) {
  const sheet = getSheet(CONFIG.SHEETS.story_ideas);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == sl) {
      sheet.getRange(i + 1, 5).setValue('Generated');
      logMessage(`Story #${sl} marked as generated`, 'INFO');
      break;
    }
  }
}

// ========================================
// GENERATION LOG
// ========================================

/**
 * Update generation log with results
 * @param {object} logEntry - Log entry data
 */
function updateGenerationLog(logEntry) {
  const sheet = getSheet(CONFIG.SHEETS.generation_log);
  
  const date = getTodayDate();
  const storyId = logEntry.storyId || 'Unknown';
  const language = 'BN, EN';
  const status = logEntry.status || 'Pending';
  const driveLink = logEntry.englishUrl || logEntry.bengaliUrl || 'N/A';
  const version = logEntry.version || 'v1';
  
  sheet.appendRow([date, storyId, language, status, driveLink, version]);
  
  logMessage('Generation log updated', 'INFO');
}

// ========================================
// REGENERATION
// ========================================

/**
 * Regenerate video for a specific story and language
 * @param {object} story - Story data
 * @param {string} language - Language code ('en' or 'bn')
 * @returns {object} Result
 */
function regenerateStoryVideo(story, language) {
  logMessage(`Regenerating ${language} video for: ${story.idea}`, 'INFO');
  
  try {
    // Expand story
    const expandedStory = expandStory(story.idea, story.moral);
    
    // Translate if Bengali
    const targetStory = language === 'bn' ? 
      translateToBengali(expandedStory) : expandedStory;
    
    // Generate media package
    const mediaPackage = createMediaPackage(targetStory, language);
    
    if (!mediaPackage.success) {
      throw new Error('Media generation failed');
    }
    
    // Create assembly instructions
    const assembly = createVideoAssemblyInstructions(mediaPackage);
    
    // Get next version number
    const version = getNextVersion(story.idea, language);
    
    // Update log
    const logEntry = {
      storyId: story.idea,
      status: 'Regenerated',
      version: version
    };
    
    if (language === 'en') {
      logEntry.englishUrl = assembly.instructionsUrl;
    } else {
      logEntry.bengaliUrl = assembly.instructionsUrl;
    }
    
    updateGenerationLog(logEntry);
    
    return {
      success: true,
      message: 'Video regenerated successfully',
      url: assembly.instructionsUrl,
      version: version
    };
  } catch (error) {
    return handleError(error, 'regenerateStoryVideo');
  }
}

/**
 * Get next version number for a story
 * @param {string} storyId - Story ID
 * @param {string} language - Language code
 * @returns {string} Version string
 */
function getNextVersion(storyId, language) {
  const sheet = getSheet(CONFIG.SHEETS.generation_log);
  const data = sheet.getDataRange().getValues();
  
  let maxVersion = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === storyId) {
      const versionStr = data[i][5] || 'v1';
      const versionNum = parseInt(versionStr.replace('v', ''));
      maxVersion = Math.max(maxVersion, versionNum);
    }
  }
  
  return 'v' + (maxVersion + 1);
}

// ========================================
// MONITORING
// ========================================

/**
 * Get system health status
 * @returns {object} Health status
 */
function getSystemHealth() {
  const health = {
    timestamp: getCurrentTimestamp(),
    sheetsAccessible: true,
    driveAccessible: true,
    apiConfigured: false,
    triggersActive: false,
    lastGeneration: null,
    approvedStories: 0
  };
  
  try {
    // Check sheets
    getSpreadsheet();
  } catch (error) {
    health.sheetsAccessible = false;
  }
  
  try {
    // Check Drive
    if (CONFIG.DRIVE_FOLDER_ID && CONFIG.DRIVE_FOLDER_ID !== 'YOUR_DRIVE_FOLDER_ID_HERE') {
      DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    } else {
      health.driveAccessible = false;
    }
  } catch (error) {
    health.driveAccessible = false;
  }
  
  // Check API configuration
  const textKey = getConfigValue('Text_API_Key');
  const imageKey = getConfigValue('Image_API_Key');
  const ttsKey = getConfigValue('TTS_API_Key');
  
  health.apiConfigured = !!(textKey && imageKey && ttsKey);
  
  // Check triggers
  const triggers = ScriptApp.getProjectTriggers();
  health.triggersActive = triggers.length > 0;
  
  // Get last generation
  const logSheet = getSheet(CONFIG.SHEETS.generation_log);
  const logData = logSheet.getDataRange().getValues();
  
  if (logData.length > 1) {
    const lastEntry = logData[logData.length - 1];
    health.lastGeneration = {
      date: lastEntry[0],
      story: lastEntry[1],
      status: lastEntry[3]
    };
  }
  
  // Count approved stories
  const ideasSheet = getSheet(CONFIG.SHEETS.story_ideas);
  const ideasData = ideasSheet.getDataRange().getValues();
  
  for (let i = 1; i < ideasData.length; i++) {
    if (ideasData[i][3] === 'Yes' && ideasData[i][4] !== 'Generated') {
      health.approvedStories++;
    }
  }
  
  return health;
}
