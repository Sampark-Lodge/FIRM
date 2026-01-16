/**
 * Code.gs - Main Google Apps Script Entry Point
 * ShishuKotha - Automated Moral Story Video Generation System
 */

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
  // Google Sheets Configuration
  SPREADSHEET_ID: '1XndTSv5uhQWUlhUslDxap_HhSTlgCxiHkKdRujnsmSw', 
  
  // Sheet Names
  SHEETS: {
    story_ideas: 'Story_Ideas',
    generation_log: 'Generation_Log',
    config: 'Config'
  },
  
  // Drive Configuration
  DRIVE_FOLDER_ID: '1Y7jNXzkX38IAVoulhV6O94lq2vHx1-rU', 
  
  // Generation Settings
  DEFAULT_MAX_SCENES: 6,
  DEFAULT_ASPECT_RATIO: '9:16',
  
  // Time Settings (IST)
  TRIGGER_TIME_HOUR: 6,  // 06:00 AM
  TRIGGER_TIME_MINUTE: 0
};

// ========================================
// SHEET ACCESS FUNCTIONS
// ========================================

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  } catch (error) {
    Logger.log('Error opening spreadsheet: ' + error);
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

function getSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheet(sheetName, sheet);
  }
  
  return sheet;
}

function initializeSheet(sheetName, sheet) {
  if (sheetName === CONFIG.SHEETS.story_ideas) {
    sheet.appendRow(['Sl', 'Idea', 'Moral', 'Approved', 'Status']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  } else if (sheetName === CONFIG.SHEETS.generation_log) {
    sheet.appendRow(['Date', 'Story_ID', 'Language', 'Status', 'Drive_Link', 'Version']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  } else if (sheetName === CONFIG.SHEETS.config) {
    sheet.appendRow(['Key', 'Value']);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    
    // Add default config values
    const defaults = [
      ['Trigger_Time', '06:00'],
      ['Max_Scenes', '6'],
      ['Aspect_Ratio', '9:16'],
      ['Text_API_Key', ''],
      ['Image_API_Key', ''],
      ['TTS_API_Key', '']
    ];
    
    defaults.forEach(row => sheet.appendRow(row));
  }
}

// ========================================
// CONFIGURATION FUNCTIONS
// ========================================

function getConfigValue(key, defaultValue = null) {
  const sheet = getSheet(CONFIG.SHEETS.config);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1] || defaultValue;
    }
  }
  
  return defaultValue;
}

function setConfigValue(key, value) {
  const sheet = getSheet(CONFIG.SHEETS.config);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  
  sheet.appendRow([key, value]);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function logMessage(message, level = 'INFO') {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  Logger.log('[' + level + '] ' + timestamp + ': ' + message);
}

function getCurrentTimestamp() {
  return new Date().toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function generateId() {
  return Utilities.getUuid();
}

function sleep(ms) {
  Utilities.sleep(ms);
}

// ========================================
// ERROR HANDLING
// ========================================

function handleError(error, context) {
  const errorMessage = 'Error in ' + context + ': ' + error.message;
  logMessage(errorMessage, 'ERROR');
  return {
    success: false,
    error: error.message,
    context: context
  };
}

// ========================================
// MAIN ORCHESTRATION
// ========================================

function main() {
  logMessage('Starting ShishuKotha daily generation process', 'INFO');
  try {
    const result = runFullPipeline();
    if (result.success) {
      logMessage('Daily generation completed successfully', 'INFO');
    } else {
      logMessage('Daily generation failed: ' + result.message, 'ERROR');
    }
    return result;
  } catch (error) {
    return handleError(error, 'main');
  }
}

function testSetup() {
  Logger.log('Testing ShishuKotha setup...');
  try {
    getSheet(CONFIG.SHEETS.story_ideas);
    getSheet(CONFIG.SHEETS.generation_log);
    getSheet(CONFIG.SHEETS.config);
    Logger.log('Status: All sheets accessible');
  } catch (error) {
    Logger.log('Status: Sheet access failed: ' + error);
    return false;
  }
  
  try {
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    Logger.log('Status: Drive folder accessible: ' + folder.getName());
  } catch (error) {
    Logger.log('Status: Drive access failed. Please set DRIVE_FOLDER_ID');
  }
  
  const apiKey = getConfigValue('Text_API_Key');
  if (!apiKey) {
    Logger.log('Status: API keys not configured');
  }
  
  Logger.log('Setup test complete!');
  return true;
}

function setupSystem() {
  Logger.log('Setting up ShishuKotha system...');
  getSheet(CONFIG.SHEETS.story_ideas);
  getSheet(CONFIG.SHEETS.generation_log);
  getSheet(CONFIG.SHEETS.config);
  Logger.log('System setup complete!');
}

/**
 * Test the media generation with a dummy story
 */
function testMediaPipeline() {
  logMessage('=== Starting Media Pipeline Test ===', 'INFO');
  
  const dummyStory = {
    title: "Test Story " + new Date().getTime(),
    scenes: [
      "A happy blue cat sits on a red mat in a sunny garden."
    ]
  };
  
  logMessage('1. Testing Image Generation...', 'INFO');
  const imageResult = generateSceneImage(dummyStory.scenes[0], dummyStory.title);
  logMessage('Image Status: ' + (imageResult.success ? 'SUCCESS' : 'FAILED: ' + imageResult.error), imageResult.success ? 'INFO' : 'ERROR');
  
  logMessage('2. Testing Voice Generation...', 'INFO');
  const voiceResult = generateVoiceover(dummyStory.scenes[0], 'en');
  logMessage('Voice Status: ' + (voiceResult.success ? 'SUCCESS' : 'FAILED: ' + voiceResult.error), voiceResult.success ? 'INFO' : 'ERROR');
  
  if (voiceResult.success) {
    logMessage('Status: VOICE GENERATION WORKING! You can proceed with media generation.', 'INFO');
    if (!imageResult.success) {
      logMessage('Note: Image generation unavailable. You can add images manually or use a different service later.', 'INFO');
    }
  } else {
    logMessage('Status: VOICE TESTS FAILED. Please check TTS API key.', 'ERROR');
  }
}

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
    const testFolder = mainFolder.createFolder('_test_folder_' + new Date().getTime());
    logMessage('Test folder created: ' + testFolder.getName(), 'INFO');
    
    // Upload test file
    const testBlob = Utilities.newBlob('Hello from ShishuKotha!', 'text/plain', 'test.txt');
    const testFile = testFolder.createFile(testBlob);
    logMessage('Test file created: ' + testFile.getName(), 'INFO');
    
    logMessage('=== DRIVE ACCESS TEST PASSED! ===', 'INFO');
    logMessage('Check your ShishuKotha folder - you should see a _test_folder_', 'INFO');
    
    return { success: true, folderUrl: testFolder.getUrl() };
  } catch (error) {
    logMessage('DRIVE ACCESS FAILED: ' + error.message, 'ERROR');
    return { success: false, error: error.message };
  }
}
