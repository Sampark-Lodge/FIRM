/**
 * Scheduler.gs - Automation & Triggers
 * 
 * Manages daily execution and pipeline orchestration
 */

// ========================================
// TRIGGER MANAGEMENT
// ========================================

/**
 * Setup the daily trigger
 */
function createDailyTrigger() {
  // Clear existing triggers first
  deleteTriggers();
  
  ScriptApp.newTrigger('runFullPipeline')
    .timeBased()
    .everyDays(1)
    .atHour(CONFIG.TRIGGER_TIME_HOUR)
    .create();
    
  logMessage('Daily trigger set for ' + CONFIG.TRIGGER_TIME_HOUR + ':00', 'INFO');
}

/**
 * Delete all triggers
 */
function deleteTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

// ========================================
// PIPELINE ORCHESTRATION
// ========================================

/**
 * MAIN PIPELINE FUNCTION
 * Runs daily to:
 * 1. Pick/Generate a story
 * 2. Create media (Images, Voice, Subtitles)
 * 3. Start Video Generation
 */
function runFullPipeline() {
  logMessage('=== STARTING DAILY PIPELINE ===', 'INFO');
  
  try {
    // 1. Get a story to process
    // First check for manually added pending ideas
    const pending = getPendingApprovals();
    let currentStory = null;
    let storySL = null;
    let storyTitle = '';
    let storyMoral = '';
    
    if (pending.length > 0) {
      logMessage('Found pending story idea: ' + pending[0].idea, 'INFO');
      storySL = pending[0].sl;
      const expansion = expandStory(pending[0].idea, pending[0].moral);
      currentStory = expansion;
      storyTitle = expansion.title;
      storyMoral = pending[0].moral;
      
      // Auto-approve if it was pending
      approveStoryIdea(storySL);
    } else {
      // Generate fresh idea
      logMessage('No pending ideas, generating new one...', 'INFO');
      // For now, simpler to just log/skip or implement IdeaGenerator if needed
      // But let's assume we rely on the sheet for now as per previous logic
      logMessage('Please add story ideas to the "Story_Ideas" sheet.', 'WARN');
      return; 
    }
    
    if (!currentStory) {
      logMessage('Failed to get story content', 'ERROR');
      return;
    }
    
    // 2. Generate Bengali Translation
    logMessage('Translating to Bengali...', 'INFO');
    const bengalStory = translateToBengali(currentStory);
    
    // 3. Create Media Packages
    // English
    const enMedia = createMediaPackage(currentStory, 'en');
    
    // Bengali (Primary)
    const bnMedia = createMediaPackage(bengalStory, 'bn');
    
    // 4. Start Video Generation (Incremental)
    // We start with Bengali as priority
    if (bnMedia.success) {
      logMessage('Starting Bengali Video Generation...', 'INFO');
      // This will set up its own trigger to run in background
      startIncrementalVideoGeneration(bnMedia.storyTitle, 'bn');
      
      // Note: English video generation can be queued or run manually to avoid
      // parallel execution complexities and rate limits
      logMessage('Note: English video generation can be started manually after Bengali finishes.', 'INFO');
    }
    
    // 5. Log Result
    logToSheet(storyTitle, enMedia.success, bnMedia.success);
    
    logMessage('=== PIPELINE INITIATED SUCCESSFULLY ===', 'INFO');
    
  } catch (error) {
    logMessage('CRITICAL PIPELINE ERROR: ' + error.message, 'ERROR');
  }
}

/**
 * Parse Log Sheet
 */
function logToSheet(title, enStatus, bnStatus) {
  const sheet = getSheet(CONFIG.SHEETS.generation_log);
  const timestamp = getCurrentTimestamp();
  
  sheet.appendRow([
    timestamp,
    title,
    enStatus ? 'Success' : 'Failed',
    bnStatus ? 'Success' : 'Failed',
    'Started' // Video Status
  ]);
}
