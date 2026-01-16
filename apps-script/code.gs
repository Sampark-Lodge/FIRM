/**
 * Code.gs - Main Entry Point & Configuration
 * 
 * ShishuKotha: Automated Bengali Moral Story Video Generator
 * 
 * CONFIGURATION:
 * All API keys and settings should be managed in the "Config" sheet of the spreadsheet.
 */
// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
  // Application Info
  APP_NAME: 'ShishuKotha',
  VERSION: '2.0.0',
  
  // Sheet Names
  SHEETS: {
    story_ideas: 'Story_Ideas',
    generation_log: 'Generation_Log',
    config: 'Config'
  },
  
  // Drive Folder ID (REPLACE WITH YOUR ID)
  DRIVE_FOLDER_ID: '1Y7jNXzkX38IAVoulhV6O94lq2vHx1-rU', // ShishuKotha Folder ID
  
  // Default Settings
  DEFAULT_LANGUAGE: 'bn', // Bengali
  DEFAULT_VIDEO_LENGTH: 'Short (< 60s)',
  DEFAULT_ASPECT_RATIO: '9:16', // Vertical for Shorts/Reels
  
  // Triggers
  TRIGGER_TIME_HOUR: 6 // 6 AM
};
// ========================================
// GLOBAL UTILITIES
// ========================================
/**
 * Get values from Config sheet
 * @param {string} key - Configuration key name
 * @returns {string} Configuration value
 */
function getConfigValue(key, defaultValue = '') {
  const sheet = getSheet(CONFIG.SHEETS.config);
  const data = sheet.getDataRange().getValues();
  
  // Skip header
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1];
    }
  }
  
  return defaultValue;
}
/**
 * Helper to get Logger with timestamp
 * @param {string} message - Message to log
 * @param {string} type - INFO, WARN, ERROR
 */
function logMessage(message, type = 'INFO') {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const log = `[${type}] ${timestamp}: ${message}`;
  Logger.log(log);
  
  // Optional: Log to a sheet if needed (commented out for performance)
  // const sheet = getSheet('System_Log');
  // sheet.appendRow([new Date(), type, message]);
  
  return log;
}
/**
 * Helper to get a sheet by name
 */
function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  return sheet;
}
/**
 * Get active spreadsheet safely
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}
/**
 * Get current date formatted
 */
function getTodayDate() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
}
/**
 * Get current timestamp
 */
function getCurrentTimestamp() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
}
/**
 * Sleep helper (pause execution)
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  Utilities.sleep(ms);
}
// ========================================
// DATA ACCESS helpers
// ========================================
/**
 * Save a new story idea to the sheet
 */
function saveStoryIdeaToSheet(idea, moral) {
  const sheet = getSheet(CONFIG.SHEETS.story_ideas);
  const lastRow = sheet.getLastRow();
  const newSl = lastRow === 1 ? 1 : sheet.getRange(lastRow, 1).getValue() + 1;
  const date = getTodayDate();
  
  sheet.appendRow([newSl, idea, moral, 'No', 'Pending', date]);
  return newSl;
}
/**
 * Get pending approvals
 */
function getPendingApprovals() {
  const sheet = getSheet(CONFIG.SHEETS.story_ideas);
  const data = sheet.getDataRange().getValues();
  const pending = [];
  
  // Skip header
  for (let i = 1; i < data.length; i++) {
    const sl = data[i][0];
    const idea = data[i][1];
    const moral = data[i][2];
    const approved = data[i][3];
    
    if (approved === 'No' || approved === '') {
      pending.push({
        sl: sl,
        idea: idea,
        moral: moral,
        rowIndex: i + 1
      });
    }
  }
  
  return pending;
}
/**
 * Mark story as approved
 */
function approveStoryIdea(sl) {
  const sheet = getSheet(CONFIG.SHEETS.story_ideas);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == sl) {
      sheet.getRange(i + 1, 4).setValue('Yes');
      return true;
    }
  }
  return false;
}
// ========================================
// TEST FUNCTIONS
// ========================================
/**
 * Test Drive folder creation and file upload
 * This verifies Drive permissions are working correctly
 */
function testDriveAccess() {
  logMessage('=== Testing Drive Access ===', 'INFO');
  
  try {
    // Test creating a folder
    const mainFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    logMessage('Main folder accessible: ' + mainFolder.getName(), 'INFO');
    
    // Create test folder
    const timestamp = new Date().getTime();
    const testFolder = mainFolder.createFolder('_test_folder_' + timestamp);
    logMessage('Test folder created: ' + testFolder.getName(), 'INFO');
    
    // Upload test file
    const testBlob = Utilities.newBlob('Hello from ShishuKotha!', 'text/plain', 'test.txt');
    const testFile = testFolder.createFile(testBlob);
    logMessage('Test file created: ' + testFile.getName(), 'INFO');
    
    // Cleanup (optional - uncomment to keep clean)
    // testFolder.setTrashed(true);
    
    logMessage('=== DRIVE ACCESS TEST PASSED! ===', 'INFO');
    logMessage('Check your Drive folder - you should see a _test_folder_', 'INFO');
    
    return { success: true, folderUrl: testFolder.getUrl() };
  } catch (error) {
    logMessage('DRIVE ACCESS FAILED: ' + error.message, 'ERROR');
    return { success: false, error: 'Authorization Error: Please ensure you have authorized the script to access Google Drive. ' + error.message };
  }
}
/**
 * Test Media Pipeline (API Check Only)
 */
function testMediaPipeline() {
  logMessage('=== Starting Media Pipeline Test ===', 'INFO');
  
  const dummyStory = {
    title: "Test Story " + new Date().getTime(),
    scenes: [
      "A happy blue cat sits on a red mat in a sunny garden."
    ]
  };
  
  logMessage('1. Testing Image Generation (Pollinations.AI)...', 'INFO');
  const imageResult = callImageGenerationAPI(dummyStory.scenes[0], '');
  logMessage('Image Status: ' + (imageResult.success ? 'SUCCESS' : 'FAILED: ' + imageResult.error), imageResult.success ? 'INFO' : 'ERROR');
  
  logMessage('2. Testing Voice Generation (Google TTS)...', 'INFO');
  // Get API key
  const ttsKey = getConfigValue('TTS_API_Key');
  if (!ttsKey) {
     logMessage('WARNING: No TTS_API_Key found in Config sheet. Voice test will fail.', 'WARN');
  }
  
  const voiceResult = callTTSAPI(dummyStory.scenes[0], {language: 'en-US'}, ttsKey);
  logMessage('Voice Status: ' + (voiceResult.success ? 'SUCCESS' : 'FAILED: ' + (voiceResult.error || 'Unknown error')), voiceResult.success ? 'INFO' : 'ERROR');
  
  if (voiceResult.success && imageResult.success) {
    logMessage('=== ALL SYSTEMS GO! ===', 'INFO');
    logMessage('You can now run "runFullPipeline"', 'INFO');
  } else {
    logMessage('=== TESTS FAILED ===', 'ERROR');
    logMessage('Please check your Config sheet and API keys.', 'ERROR');
  }
}
