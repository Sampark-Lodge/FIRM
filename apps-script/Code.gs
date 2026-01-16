/**
 * Code.gs - Main Google Apps Script Entry Point
 * ShishuKotha - Automated Moral Story Video Generation System
 * 
 * This is the main orchestration script that connects all components.
 * It manages configuration, sheet access, and coordinates the workflow.
 */

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
  // Google Sheets Configuration
  SPREADSHEET_ID: '1XndTSv5uhQWUlhUslDxap_HhSTlgCxiHkKdRujnsmSw', // Updated with user ID
  
  // Sheet Names
  SHEETS: {
    story_ideas: 'Story_Ideas',
    generation_log: 'Generation_Log',
    config: 'Config'
  },
  
  // Drive Configuration
  DRIVE_FOLDER_ID: '1Y7jNXzkX38IAVoulhV6O94lq2vHx1-rU', // Updated with user ID
  
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

/**
 * Get the active spreadsheet
 * @returns {Spreadsheet} Spreadsheet object
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  } catch (error) {
    Logger.log('Error opening spreadsheet: ' + error);
    // Fallback to active spreadsheet if ID not configured
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

/**
 * Get a specific sheet by name
 * @param {string} sheetName - Name of the sheet
 * @returns {Sheet} Sheet object
 */
function getSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheet(sheetName, sheet);
  }
  
  return sheet;
}

/**
 * Initialize a new sheet with headers
 * @param {string} sheetName - Name of the sheet
 * @param {Sheet} sheet - Sheet object
 */
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

/**
 * Get configuration value
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Configuration value
 */
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

/**
 * Set configuration value
 * @param {string} key - Configuration key
 * @param {*} value - Configuration value
 */
function setConfigValue(key, value) {
  const sheet = getSheet(CONFIG.SHEETS.config);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  
  // Add new config if not found
  sheet.appendRow([key, value]);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Log message to sheet and console
 * @param {string} message - Message to log
 * @param {string} level - Log level (INFO, WARNING, ERROR)
 */
function logMessage(message, level = 'INFO') {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  Logger.log(`[${level}] ${timestamp}: ${message}`);
  
  // You can also log to a separate Logs sheet if needed
}

/**
 * Get current IST timestamp
 * @returns {string} Formatted timestamp
 */
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

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Date string
 */
function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
  return Utilities.getUuid();
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  Utilities.sleep(ms);
}

// ========================================
// ERROR HANDLING
// ========================================

/**
 * Handle error and log it
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 */
function handleError(error, context) {
  const errorMessage = `Error in ${context}: ${error.message}`;
  logMessage(errorMessage, 'ERROR');
  
  // You can also send email notification for critical errors
  // MailApp.sendEmail({
  //   to: 'your-email@example.com',
  //   subject: 'ShishuKotha Error',
  //   body: errorMessage
  // });
  
  return {
    success: false,
    error: error.message,
    context: context
  };
}

// ========================================
// MAIN ORCHESTRATION
// ========================================

/**
 * Main entry point for the system
 * This function is called by the daily trigger
 */
function main() {
  logMessage('Starting ShishuKotha daily generation process', 'INFO');
  
  try {
    // Run the full pipeline
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

/**
 * Test function to verify setup
 */
function testSetup() {
  Logger.log('Testing ShishuKotha setup...');
  
  // Test sheet access
  try {
    const storySheet = getSheet(CONFIG.SHEETS.story_ideas);
    const logSheet = getSheet(CONFIG.SHEETS.generation_log);
    const configSheet = getSheet(CONFIG.SHEETS.config);
    
    Logger.log('âœ“ All sheets accessible');
  } catch (error) {
    Logger.log('âœ— Sheet access failed: ' + error);
    return false;
  }
  
  // Test Drive access
  try {
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    Logger.log('âœ“ Drive folder accessible: ' + folder.getName());
  } catch (error) {
    Logger.log('âœ— Drive access failed. Please set DRIVE_FOLDER_ID');
  }
  
  // Test configuration
  const apiKey = getConfigValue('Text_API_Key');
  if (!apiKey) {
    Logger.log('âš  API keys not configured');
  }
  
  Logger.log('Setup test complete!');
  return true;
}

/**
 * Setup function to initialize the system
 */
function setupSystem() {
  Logger.log('Setting up ShishuKotha system...');
  
  // Initialize all sheets
  getSheet(CONFIG.SHEETS.story_ideas);
  getSheet(CONFIG.SHEETS.generation_log);
  getSheet(CONFIG.SHEETS.config);
  
  Logger.log('System setup complete!');
  Logger.log('Next steps:');
  Logger.log('1. Update CONFIG.SPREADSHEET_ID and CONFIG.DRIVE_FOLDER_ID');
  Logger.log('2. Add API keys in the Config sheet');
  Logger.log('3. Deploy as Web App');
  Logger.log('4. Setup daily trigger');
}
/ * *  
   *   T e s t   t h e   m e d i a   g e n e r a t i o n   w i t h   a   d u m m y   s t o r y  
   *   R u n   t h i s   t o   v e r i f y   A P I   k e y s   a n d   D r i v e   a c c e s s  
   * /  
 f u n c t i o n   t e s t M e d i a P i p e l i n e ( )   {  
         l o g M e s s a g e ( ' = = =   S t a r t i n g   M e d i a   P i p e l i n e   T e s t   = = = ' ,   ' I N F O ' ) ;  
  
         c o n s t   d u m m y S t o r y   =   {  
                 t i t l e :   " T e s t   S t o r y   "   +   n e w   D a t e ( ) . g e t T i m e ( ) ,  
                 s c e n e s :   [  
                         " A   h a p p y   b l u e   c a t   s i t s   o n   a   r e d   m a t   i n   a   s u n n y   g a r d e n . "  
                 ]  
         } ;  
  
         l o g M e s s a g e ( ' 1 .   T e s t i n g   I m a g e   G e n e r a t i o n . . . ' ,   ' I N F O ' ) ;  
         c o n s t   i m a g e R e s u l t   =   g e n e r a t e S c e n e I m a g e ( d u m m y S t o r y . s c e n e s [ 0 ] ,   d u m m y S t o r y . t i t l e ) ;  
         l o g M e s s a g e ( ' I m a g e   R e s u l t :   '   +   ( i m a g e R e s u l t . s u c c e s s   ?   ' â S&   S U C C E S S '   :   ' â  R  F A I L E D :   '   +   i m a g e R e s u l t . e r r o r ) ,   i m a g e R e s u l t . s u c c e s s   ?   ' I N F O '   :   ' E R R O R ' ) ;  
  
         l o g M e s s a g e ( ' 2 .   T e s t i n g   V o i c e   G e n e r a t i o n . . . ' ,   ' I N F O ' ) ;  
         c o n s t   v o i c e R e s u l t   =   g e n e r a t e V o i c e o v e r ( d u m m y S t o r y . s c e n e s [ 0 ] ,   ' e n ' ) ;  
         l o g M e s s a g e ( ' V o i c e   R e s u l t :   '   +   ( v o i c e R e s u l t . s u c c e s s   ?   ' â S&   S U C C E S S '   :   ' â  R  F A I L E D :   '   +   v o i c e R e s u l t . e r r o r ) ,   v o i c e R e s u l t . s u c c e s s   ?   ' I N F O '   :   ' E R R O R ' ) ;  
  
         i f   ( i m a g e R e s u l t . s u c c e s s   & &   v o i c e R e s u l t . s u c c e s s )   {  
                 l o g M e s s a g e ( ' â S&   A L L   S Y S T E M   T E S T S   P A S S E D !   M e d i a   g e n e r a t i o n   i s   w o r k i n g   p e r f e c t l y . ' ,   ' I N F O ' ) ;  
                 l o g M e s s a g e ( ' Y o u   c a n   n o w   r u n   " r u n F u l l P i p e l i n e "   o r   u s e   t h e   D a s h b o a r d   b u t t o n . ' ,   ' I N F O ' ) ;  
         }   e l s e   {  
                 l o g M e s s a g e ( ' â  R  T E S T S   F A I L E D .   P l e a s e   c h e c k   A P I   k e y s   i n   C o n f i g   s h e e t . ' ,   ' E R R O R ' ) ;  
         }  
 }  
 