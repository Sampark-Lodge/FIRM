/**
 * VideoGenerator.gs - Image-to-Video Animation
 * Uses Kling AI API to convert story images into animated videos
 */

// ========================================
// KLING AI CONFIGURATION
// ========================================

const KLING_CONFIG = {
  ACCESS_KEY: 'AykKGKpJQhHQtKgJQdRYNgFAKGGCfeJE',
  SECRET_KEY: 'HEMhb9n9DmNtrdEMngkLFNE8CBpQmAGD',
  API_BASE: 'https://api.klingai.com'
};

// ========================================
// STATE MANAGEMENT (for handling timeouts)
// ========================================

/**
 * Get the current processing state from Script Properties
 */
function getVideoProcessingState() {
  const props = PropertiesService.getScriptProperties();
  const state = props.getProperty('VIDEO_PROCESSING_STATE');
  return state ? JSON.parse(state) : null;
}

/**
 * Save processing state to Script Properties
 */
function saveVideoProcessingState(state) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('VIDEO_PROCESSING_STATE', JSON.stringify(state));
}

/**
 * Clear processing state
 */
function clearVideoProcessingState() {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('VIDEO_PROCESSING_STATE');
  logMessage('Video processing state cleared', 'INFO');
}

/**
 * Start incremental video generation for a story
 * This processes ONE scene at a time to avoid timeout
 * @param {string} storyFolderName - Name of story folder
 * @param {string} language - 'en' or 'bn'
 */
function startIncrementalVideoGeneration(storyFolderName, language) {
  logMessage('Starting incremental video generation: ' + storyFolderName + ' (' + language + ')', 'INFO');
  
  // Initialize state
  const state = {
    storyFolderName: storyFolderName,
    language: language,
    currentScene: 1,
    totalScenes: 0,
    completedScenes: [],
    status: 'running',
    startedAt: new Date().toISOString()
  };
  
  // Count total scenes
  try {
    const mainFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const storyFolder = mainFolder.getFoldersByName(storyFolderName).next();
    const imagesFolder = storyFolder.getFoldersByName('images').next();
    const images = imagesFolder.getFiles();
    
    let count = 0;
    while (images.hasNext()) {
      const file = images.next();
      if (file.getName().startsWith(language + '_scene_')) count++;
    }
    
    state.totalScenes = count;
    saveVideoProcessingState(state);
    
    logMessage('Found ' + count + ' scenes to process', 'INFO');
    
    // Process first scene immediately
    processNextVideoScene();
    
    // Set up trigger for remaining scenes
    if (count > 1) {
      setupVideoProcessingTrigger();
    }
    
  } catch (error) {
    logMessage('Error starting incremental generation: ' + error.message, 'ERROR');
    clearVideoProcessingState();
  }
}

/**
 * Process the next scene in the queue
 * Called by trigger to continue processing
 */
function processNextVideoScene() {
  const state = getVideoProcessingState();
  
  if (!state) {
    logMessage('No video processing state found. Nothing to process.', 'INFO');
    return;
  }
  
  if (state.currentScene > state.totalScenes) {
    logMessage('All scenes processed! Cleaning up...', 'INFO');
    clearVideoProcessingState();
    removeVideoProcessingTrigger();
    return;
  }
  
  logMessage('Processing scene ' + state.currentScene + '/' + state.totalScenes, 'INFO');
  
  try {
    const mainFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const storyFolder = mainFolder.getFoldersByName(state.storyFolderName).next();
    const imagesFolder = storyFolder.getFoldersByName('images').next();
    
    // Find the image for current scene
    const images = imagesFolder.getFiles();
    let targetImage = null;
    
    while (images.hasNext()) {
      const file = images.next();
      if (file.getName() === state.language + '_scene_' + state.currentScene + '.jpg') {
        targetImage = file;
        break;
      }
    }
    
    if (!targetImage) {
      logMessage('Scene ' + state.currentScene + ' image not found, skipping', 'INFO');
    } else {
      // Check if already animated
      const existingFiles = storyFolder.getFiles();
      let alreadyAnimated = false;
      while (existingFiles.hasNext()) {
        if (existingFiles.next().getName() === state.language + '_scene_' + state.currentScene + '_animated.mp4') {
          alreadyAnimated = true;
          break;
        }
      }
      
      if (alreadyAnimated) {
        logMessage('Scene ' + state.currentScene + ' already animated, skipping', 'INFO');
      } else {
        // Generate video
        const videoResult = generateVideoFromImage(
          targetImage.getDownloadUrl(),
          'Gentle children story animation'
        );
        
        if (videoResult.success) {
          const videoBlob = UrlFetchApp.fetch(videoResult.videoUrl).getBlob();
          const videoFile = storyFolder.createFile(videoBlob);
          videoFile.setName(state.language + '_scene_' + state.currentScene + '_animated.mp4');
          
          state.completedScenes.push(state.currentScene);
          logMessage('Scene ' + state.currentScene + ' animated and saved!', 'INFO');
        } else {
          logMessage('Scene ' + state.currentScene + ' animation failed: ' + videoResult.error, 'ERROR');
        }
      }
    }
    
    // Move to next scene
    state.currentScene++;
    saveVideoProcessingState(state);
    
    // Check if done
    if (state.currentScene > state.totalScenes) {
      logMessage('=== ALL SCENES COMPLETED! ===', 'INFO');
      logMessage('Completed: ' + state.completedScenes.length + '/' + state.totalScenes, 'INFO');
      clearVideoProcessingState();
      removeVideoProcessingTrigger();
    }
    
  } catch (error) {
    logMessage('Error processing scene: ' + error.message, 'ERROR');
    state.status = 'error';
    state.error = error.message;
    saveVideoProcessingState(state);
  }
}

/**
 * Setup a time-based trigger to continue processing
 */
function setupVideoProcessingTrigger() {
  // Remove existing triggers first
  removeVideoProcessingTrigger();
  
  // Create trigger to run every 5 minutes
  ScriptApp.newTrigger('processNextVideoScene')
    .timeBased()
    .everyMinutes(5)
    .create();
  
  logMessage('Video processing trigger installed (every 5 min)', 'INFO');
}

/**
 * Remove video processing triggers
 */
function removeVideoProcessingTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'processNextVideoScene') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
}

/**
 * Check current video processing status
 */
function checkVideoProcessingStatus() {
  const state = getVideoProcessingState();
  
  if (!state) {
    logMessage('No video processing in progress', 'INFO');
    return null;
  }
  
  logMessage('=== Video Processing Status ===', 'INFO');
  logMessage('Story: ' + state.storyFolderName, 'INFO');
  logMessage('Language: ' + state.language, 'INFO');
  logMessage('Progress: ' + (state.currentScene - 1) + '/' + state.totalScenes + ' scenes', 'INFO');
  logMessage('Status: ' + state.status, 'INFO');
  
  return state;
}

// ========================================
// AUTHENTICATION
// ========================================

/**
 * Generate JWT token for Kling AI API authentication
 */
function generateKlingJWT() {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: KLING_CONFIG.ACCESS_KEY,
    exp: now + 1800, // 30 minutes
    nbf: now - 5
  };
  
  const encodedHeader = Utilities.base64EncodeWebSafe(JSON.stringify(header));
  const encodedPayload = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
  
  const signatureInput = encodedHeader + '.' + encodedPayload;
  const signature = Utilities.computeHmacSha256Signature(signatureInput, KLING_CONFIG.SECRET_KEY);
  const encodedSignature = Utilities.base64EncodeWebSafe(signature);
  
  return encodedHeader + '.' + encodedPayload + '.' + encodedSignature;
}

// ========================================
// IMAGE TO VIDEO GENERATION
// ========================================

/**
 * Convert an image to an animated video
 * @param {string} imageUrl - URL of the image to animate
 * @param {string} prompt - Optional motion prompt
 * @returns {object} Result with video URL or error
 */
function generateVideoFromImage(imageUrl, prompt) {
  logMessage('Starting image-to-video generation...', 'INFO');
  
  try {
    const token = generateKlingJWT();
    
    const payload = {
      model_name: 'kling-v1',
      image: imageUrl,
      prompt: prompt || 'Gentle animation with subtle movement',
      cfg_scale: 0.5,
      mode: 'std',
      duration: '5'
    };
    
    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    // Submit task
    const response = UrlFetchApp.fetch(KLING_CONFIG.API_BASE + '/v1/videos/image2video', options);
    const result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() !== 200) {
      throw new Error('Kling API Error: ' + JSON.stringify(result));
    }
    
    const taskId = result.data.task_id;
    logMessage('Video generation task submitted: ' + taskId, 'INFO');
    
    // Poll for completion
    return pollVideoTask(taskId, token);
    
  } catch (error) {
    logMessage('Video generation failed: ' + error.message, 'ERROR');
    return { success: false, error: error.message };
  }
}

/**
 * Poll for video generation task completion
 */
function pollVideoTask(taskId, token) {
  const maxAttempts = 30; // 5 minutes max (10 sec intervals)
  
  for (let i = 0; i < maxAttempts; i++) {
    Utilities.sleep(10000); // Wait 10 seconds
    
    const options = {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(
      KLING_CONFIG.API_BASE + '/v1/videos/image2video/' + taskId, 
      options
    );
    const result = JSON.parse(response.getContentText());
    
    if (result.data.task_status === 'succeed') {
      const videoUrl = result.data.task_result.videos[0].url;
      logMessage('Video generated successfully!', 'INFO');
      return { success: true, videoUrl: videoUrl };
    } else if (result.data.task_status === 'failed') {
      throw new Error('Video generation failed: ' + result.data.task_status_msg);
    }
    
    logMessage('Video generation in progress... (' + (i + 1) + '/' + maxAttempts + ')', 'INFO');
  }
  
  return { success: false, error: 'Video generation timed out' };
}

// ========================================
// FULL VIDEO ASSEMBLY PIPELINE
// ========================================

/**
 * Generate complete story video:
 * 1. Animate all scene images
 * 2. Combine with audio
 * 3. Add subtitles
 * 4. Create final video in both English and Bengali
 * 
 * @param {string} storyFolderName - Name of story folder in Drive
 */
function generateCompleteStoryVideos(storyFolderName) {
  logMessage('=== Starting Complete Video Generation ===', 'INFO');
  logMessage('Story: ' + storyFolderName, 'INFO');
  
  try {
    // Find story folder
    const mainFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const storyFolders = mainFolder.getFoldersByName(storyFolderName);
    
    if (!storyFolders.hasNext()) {
      throw new Error('Story folder not found: ' + storyFolderName);
    }
    
    const storyFolder = storyFolders.next();
    
    // Generate for both languages
    const results = {
      english: null,
      bengali: null
    };
    
    // Generate English version
    logMessage('Creating English video...', 'INFO');
    results.english = createFinalVideo(storyFolder, 'en');
    
    // Generate Bengali version
    logMessage('Creating Bengali video...', 'INFO');
    results.bengali = createFinalVideo(storyFolder, 'bn');
    
    logMessage('=== Video Generation Complete! ===', 'INFO');
    
    return results;
    
  } catch (error) {
    logMessage('Complete video generation failed: ' + error.message, 'ERROR');
    return { success: false, error: error.message };
  }
}

/**
 * Create final video for a specific language
 * Combines animated scenes with audio and subtitles
 */
function createFinalVideo(storyFolder, language) {
  const langName = language === 'en' ? 'English' : 'Bengali';
  logMessage('Processing ' + langName + ' version...', 'INFO');
  
  try {
    // Get subfolders
    const imagesFolder = storyFolder.getFoldersByName('images').next();
    const audioFolder = storyFolder.getFoldersByName('audio').next();
    const subtitleFolder = storyFolder.getFoldersByName('subtitle').next();
    
    // Collect scene data
    const scenes = [];
    const imageFiles = imagesFolder.getFiles();
    
    while (imageFiles.hasNext()) {
      const imageFile = imageFiles.next();
      const fileName = imageFile.getName();
      
      if (!fileName.startsWith(language + '_scene_')) continue;
      
      const sceneNum = parseInt(fileName.match(/scene_(\d+)/)[1]);
      
      // Find matching audio
      const audioFiles = audioFolder.getFiles();
      let audioFile = null;
      while (audioFiles.hasNext()) {
        const af = audioFiles.next();
        if (af.getName() === language + '_scene_' + sceneNum + '.mp3') {
          audioFile = af;
          break;
        }
      }
      
      scenes.push({
        sceneNumber: sceneNum,
        imageFile: imageFile,
        imageUrl: imageFile.getDownloadUrl(),
        audioFile: audioFile,
        audioUrl: audioFile ? audioFile.getDownloadUrl() : null
      });
    }
    
    // Sort by scene number
    scenes.sort((a, b) => a.sceneNumber - b.sceneNumber);
    
    logMessage('Found ' + scenes.length + ' scenes for ' + langName, 'INFO');
    
    // Get subtitle file
    const subtitleFiles = subtitleFolder.getFiles();
    let subtitleFile = null;
    while (subtitleFiles.hasNext()) {
      const sf = subtitleFiles.next();
      if (sf.getName() === language + '.srt') {
        subtitleFile = sf;
        break;
      }
    }
    
    // Create video assembly instruction file
    const assemblyData = {
      language: language,
      languageName: langName,
      storyFolder: storyFolder.getName(),
      totalScenes: scenes.length,
      scenes: scenes.map(s => ({
        scene: s.sceneNumber,
        image: s.imageFile.getName(),
        imageUrl: s.imageUrl,
        audio: s.audioFile ? s.audioFile.getName() : null,
        audioUrl: s.audioUrl,
        duration: 8 // seconds per scene
      })),
      subtitle: subtitleFile ? subtitleFile.getName() : null,
      subtitleUrl: subtitleFile ? subtitleFile.getDownloadUrl() : null,
      totalDuration: scenes.length * 8,
      createdAt: new Date().toISOString()
    };
    
    // Save assembly instructions
    const assemblyBlob = Utilities.newBlob(
      JSON.stringify(assemblyData, null, 2), 
      'application/json', 
      'final_video_' + language + '_instructions.json'
    );
    storyFolder.createFile(assemblyBlob);
    
    logMessage('Video assembly instructions saved: final_video_' + language + '_instructions.json', 'INFO');
    
    // Animate each scene (if not already animated)
    const animatedVideos = [];
    
    for (const scene of scenes) {
      logMessage('Animating scene ' + scene.sceneNumber + '/' + scenes.length + '...', 'INFO');
      
      // Check if already animated
      const existingFiles = storyFolder.getFiles();
      let alreadyAnimated = false;
      while (existingFiles.hasNext()) {
        if (existingFiles.next().getName() === language + '_scene_' + scene.sceneNumber + '_animated.mp4') {
          alreadyAnimated = true;
          logMessage('Scene ' + scene.sceneNumber + ' already animated, skipping', 'INFO');
          break;
        }
      }
      
      if (!alreadyAnimated) {
        const videoResult = generateVideoFromImage(
          scene.imageUrl, 
          'Gentle children story animation, smooth movement'
        );
        
        if (videoResult.success) {
          // Download and save animated video
          const videoBlob = UrlFetchApp.fetch(videoResult.videoUrl).getBlob();
          const videoFile = storyFolder.createFile(videoBlob);
          videoFile.setName(language + '_scene_' + scene.sceneNumber + '_animated.mp4');
          
          animatedVideos.push({
            scene: scene.sceneNumber,
            url: videoFile.getUrl(),
            audioUrl: scene.audioUrl
          });
          
          logMessage('Scene ' + scene.sceneNumber + ' animated and saved', 'INFO');
        } else {
          logMessage('Failed to animate scene ' + scene.sceneNumber + ': ' + videoResult.error, 'ERROR');
        }
        
        // Rate limiting
        Utilities.sleep(3000);
      }
    }
    
    // Create final assembly script for manual/external processing
    const finalScript = createFfmpegScript(storyFolder.getName(), language, scenes);
    const scriptBlob = Utilities.newBlob(finalScript, 'text/plain', 'assemble_' + language + '.sh');
    storyFolder.createFile(scriptBlob);
    
    logMessage(langName + ' video processing complete!', 'INFO');
    
    return {
      success: true,
      language: language,
      scenesProcessed: scenes.length,
      animatedVideos: animatedVideos.length,
      assemblyInstructions: 'final_video_' + language + '_instructions.json'
    };
    
  } catch (error) {
    logMessage('Error creating ' + langName + ' video: ' + error.message, 'ERROR');
    return { success: false, error: error.message };
  }
}

/**
 * Create FFmpeg script for local video assembly
 * User can run this script locally to combine videos with audio and subtitles
 */
function createFfmpegScript(storyName, language, scenes) {
  const langName = language === 'en' ? 'English' : 'Bengali';
  
  let script = '#!/bin/bash\n';
  script += '# FFmpeg Assembly Script for ' + storyName + ' (' + langName + ')\n';
  script += '# Run this script locally after downloading all files\n\n';
  
  script += 'echo "Assembling ' + langName + ' video for: ' + storyName + '"\n\n';
  
  // Create concat file
  script += '# Step 1: Create concat list\n';
  script += 'cat > concat_' + language + '.txt << EOF\n';
  for (const scene of scenes) {
    script += "file '" + language + '_scene_' + scene.sceneNumber + "_animated.mp4'\n";
  }
  script += 'EOF\n\n';
  
  // Concatenate videos
  script += '# Step 2: Concatenate all scene videos\n';
  script += 'ffmpeg -f concat -safe 0 -i concat_' + language + '.txt -c copy temp_video_' + language + '.mp4\n\n';
  
  // Merge audio files
  script += '# Step 3: Concatenate all audio files\n';
  script += 'ffmpeg -i "concat:';
  for (let i = 0; i < scenes.length; i++) {
    script += language + '_scene_' + (i + 1) + '.mp3';
    if (i < scenes.length - 1) script += '|';
  }
  script += '" -acodec copy temp_audio_' + language + '.mp3\n\n';
  
  // Combine video and audio
  script += '# Step 4: Combine video with audio\n';
  script += 'ffmpeg -i temp_video_' + language + '.mp4 -i temp_audio_' + language + '.mp3 ';
  script += '-c:v copy -c:a aac -strict experimental temp_combined_' + language + '.mp4\n\n';
  
  // Add subtitles
  script += '# Step 5: Burn subtitles into video\n';
  script += 'ffmpeg -i temp_combined_' + language + '.mp4 -vf "subtitles=' + language + '.srt" ';
  script += '-c:a copy final_' + storyName + '_' + language + '.mp4\n\n';
  
  // Cleanup
  script += '# Step 6: Cleanup temporary files\n';
  script += 'rm -f concat_' + language + '.txt temp_*.mp4 temp_*.mp3\n\n';
  
  script += 'echo "Done! Final video: final_' + storyName + '_' + language + '.mp4"\n';
  
  return script;
}

// ========================================
// TEST FUNCTIONS
// ========================================

/**
 * Test video generation for a specific story
 * Call this with your story folder name
 */
function testGenerateStoryVideo() {
  // Replace with your actual story folder name
  const storyFolderName = 'the_greedy_dog';
  
  logMessage('Testing video generation for: ' + storyFolderName, 'INFO');
  
  const result = generateCompleteStoryVideos(storyFolderName);
  
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * COMPREHENSIVE TEST: Verify all video generation components work
 * Run this before attempting full video generation
 */
function testVideoGenerationPipeline() {
  logMessage('=== COMPREHENSIVE VIDEO PIPELINE TEST ===', 'INFO');
  
  const testResults = {
    authentication: false,
    driveAccess: false,
    klingApiConnection: false,
    storyFolderFound: false,
    allTestsPassed: false
  };
  
  // Test 1: JWT Authentication
  logMessage('Test 1: JWT Authentication...', 'INFO');
  try {
    const token = generateKlingJWT();
    if (token && token.split('.').length === 3) {
      testResults.authentication = true;
      logMessage('✓ JWT Token generated successfully', 'INFO');
    } else {
      throw new Error('Invalid JWT format');
    }
  } catch (error) {
    logMessage('✗ JWT Authentication failed: ' + error.message, 'ERROR');
  }
  
  // Test 2: Drive Access
  logMessage('Test 2: Drive Folder Access...', 'INFO');
  try {
    const mainFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    logMessage('✓ Main folder accessible: ' + mainFolder.getName(), 'INFO');
    testResults.driveAccess = true;
  } catch (error) {
    logMessage('✗ Drive access failed: ' + error.message, 'ERROR');
  }
  
  // Test 3: Kling AI API Connection
  logMessage('Test 3: Kling AI API Connection...', 'INFO');
  try {
    const token = generateKlingJWT();
    const response = UrlFetchApp.fetch(KLING_CONFIG.API_BASE + '/v1/videos/image2video', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      payload: JSON.stringify({
        model_name: 'kling-v1',
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100',
        prompt: 'test',
        mode: 'std',
        duration: '5'
      }),
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    const body = response.getContentText();
    
    if (code === 200) {
      testResults.klingApiConnection = true;
      logMessage('✓ Kling AI API connected and responding', 'INFO');
      
      // Parse and log task ID if available
      try {
        const data = JSON.parse(body);
        if (data.data && data.data.task_id) {
          logMessage('  Task ID received: ' + data.data.task_id, 'INFO');
        }
      } catch (e) {}
    } else if (code === 401) {
      logMessage('✗ Kling API: Authentication failed (check keys)', 'ERROR');
    } else if (code === 429) {
      logMessage('⚠ Kling API: Rate limited (but connection works)', 'INFO');
      testResults.klingApiConnection = true; // Connection works, just rate limited
    } else {
      logMessage('✗ Kling API returned code ' + code + ': ' + body.substring(0, 200), 'ERROR');
    }
  } catch (error) {
    logMessage('✗ Kling API connection failed: ' + error.message, 'ERROR');
  }
  
  // Test 4: Story Folder Check
  logMessage('Test 4: Story Folder Check...', 'INFO');
  try {
    const mainFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const folders = mainFolder.getFolders();
    let storyCount = 0;
    let sampleStory = null;
    
    while (folders.hasNext()) {
      const folder = folders.next();
      const name = folder.getName();
      if (!name.startsWith('_')) { // Skip test folders
        storyCount++;
        if (!sampleStory) sampleStory = name;
      }
    }
    
    if (storyCount > 0) {
      testResults.storyFolderFound = true;
      logMessage('✓ Found ' + storyCount + ' story folder(s)', 'INFO');
      logMessage('  Sample: ' + sampleStory, 'INFO');
    } else {
      logMessage('⚠ No story folders found. Run runFullPipeline first.', 'INFO');
    }
  } catch (error) {
    logMessage('✗ Story folder check failed: ' + error.message, 'ERROR');
  }
  
  // Summary
  logMessage('=== TEST SUMMARY ===', 'INFO');
  
  const passed = Object.values(testResults).filter(v => v === true).length - 1; // -1 for allTestsPassed
  const total = Object.keys(testResults).length - 1;
  
  if (testResults.authentication && testResults.driveAccess && testResults.klingApiConnection) {
    testResults.allTestsPassed = true;
    logMessage('★ ALL CORE TESTS PASSED! (' + passed + '/' + total + ')', 'INFO');
    logMessage('You can now run testGenerateStoryVideo() or generateCompleteStoryVideos()', 'INFO');
  } else {
    logMessage('✗ Some tests failed (' + passed + '/' + total + ')', 'ERROR');
    logMessage('Please fix the failed components before proceeding', 'ERROR');
  }
  
  return testResults;
}
