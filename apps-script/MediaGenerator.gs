/**
 * MediaGenerator.gs - Multimedia Asset Creation
 * 
 * Handles:
 * 1. Image Generation (Pollinations.AI) - Free
 * 2. Voice Generation (Google Cloud TTS) - Free
 * 3. Subtitle Generation
 * 4. Google Drive Organization
 */

// ========================================
// MAIN MEDIA GENERATION PIPELINE
// ========================================

/**
 * Create all media assets for a story
 * @param {object} story - Story object with title and scenes
 * @param {string} language - 'en' or 'bn'
 * @returns {object} Result with folder URLs
 */
function createMediaPackage(story, language) {
  logMessage('Creating media package: ' + story.title + ' (' + language + ')', 'INFO');
  
  if (!story || !story.title || !story.scenes || !Array.isArray(story.scenes)) {
    logMessage('Error: Invalid story structure', 'ERROR');
    return { success: false, error: 'Invalid story structure' };
  }
  
  // Create story folder structure
  const folders = getOrCreateStoryFolder(story.title);
  logMessage('Created story folder: ' + folders.main.getName(), 'INFO');
  
  const mediaPackage = {
    storyTitle: story.title,
    language: language,
    folderUrl: folders.main.getUrl(),
    scenes: [],
    subtitles: null,
    success: true
  };
  
  try {
    for (let i = 0; i < story.scenes.length; i++) {
      const scene = story.scenes[i];
      if (!scene || typeof scene !== 'string') continue;
      
      logMessage('Processing scene ' + (i + 1) + '/' + story.scenes.length, 'INFO');
      
      // Image Generation (Pollinations.AI)
      const imageData = generateSceneImage(scene, story.title);
      let imageUrl = null;
      if (imageData.success && imageData.blob) {
        const imageFilename = language + '_scene_' + (i + 1) + '.jpg';
        const uploadResult = uploadToDrive(imageData.blob, imageFilename, folders.images);
        imageUrl = uploadResult.success ? uploadResult.url : null;
      } else {
        logMessage('Skipping image for scene ' + (i + 1) + ' (API unavailable)', 'INFO');
      }
      
      // Voice Generation (Google TTS)
      const audioData = generateVoiceover(scene, language);
      let audioUrl = null;
      if (audioData.success && audioData.blob) {
        const audioFilename = language + '_scene_' + (i + 1) + '.mp3';
        const uploadResult = uploadToDrive(audioData.blob, audioFilename, folders.audio);
        audioUrl = uploadResult.success ? uploadResult.url : null;
      }
      
      mediaPackage.scenes.push({
        sceneNumber: i + 1,
        text: scene,
        imageUrl: imageUrl,
        audioUrl: audioUrl
      });
      
      // Rate limiting
      sleep(1000);
    }
    
    // Subtitles Generation
    const subtitles = generateSubtitles(story, language);
    const subtitleBlob = Utilities.newBlob(subtitles, 'text/plain', language + '.srt');
    const subtitleUpload = uploadToDrive(subtitleBlob, language + '.srt', folders.subtitle);
    if (subtitleUpload.success) mediaPackage.subtitles = subtitleUpload.url;
    
    // Metadata in main folder
    const metadataBlob = Utilities.newBlob(JSON.stringify(mediaPackage, null, 2), 'application/json',
      language + '_metadata.json');
    uploadToDrive(metadataBlob, language + '_metadata.json', folders.main);
    
    logMessage('Media package complete! Folder: ' + folders.main.getName(), 'INFO');
    return mediaPackage;
  } catch (error) {
    logMessage('Error creating media package: ' + error, 'ERROR');
    mediaPackage.success = false;
    mediaPackage.error = error.message;
    return mediaPackage;
  }
}

// ========================================
// VIDEO ASSEMBLY INSTRUCTIONS
// ========================================

function createVideoAssemblyInstructions(mediaPackage, storyFolder) {
  const instructions = {
    title: mediaPackage.storyTitle,
    language: mediaPackage.language,
    aspectRatio: getConfigValue('Aspect_Ratio', CONFIG.DEFAULT_ASPECT_RATIO),
    scenes: mediaPackage.scenes.map(scene => ({
      sceneNumber: scene.sceneNumber,
      imageUrl: scene.imageUrl,
      audioUrl: scene.audioUrl,
      text: scene.text,
      duration: 8
    })),
    subtitles: mediaPackage.subtitles
  };
  
  const blob = Utilities.newBlob(JSON.stringify(instructions, null, 2), 'application/json',
    'video_assembly_' + mediaPackage.language + '.json');
  
  // Use provided folder or fallback to main Drive folder
  const targetFolder = storyFolder || DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  const upload = uploadToDrive(blob, 'video_assembly_' + mediaPackage.language + '.json', targetFolder);
  
  return { success: upload.success, instructionsUrl: upload.url };
}

// ========================================
// API INTEGRATION
// ========================================

/**
 * Generate image via Pollinations.AI
 */
function callImageGenerationAPI(prompt, apiKey) {
  // Using Pollinations.AI - FREE, no API key needed!
  // URL encode the prompt
  const encodedPrompt = encodeURIComponent(prompt);
  const url = 'https://image.pollinations.ai/prompt/' + encodedPrompt + '?width=720&height=1280&nologo=true';
  
  try {
    logMessage('Fetching image from Pollinations.AI...', 'INFO');
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    
    if (response.getResponseCode() !== 200) {
      throw new Error('Pollinations Error: ' + response.getResponseCode());
    }
    
    const imageBlob = response.getBlob();
    return { success: true, blob: imageBlob, placeholder: false };
  } catch (error) {
    logMessage('Image API Call Failed: ' + error.message, 'ERROR');
    return { success: false, error: error.message, placeholder: true };
  }
}

/**
 * Generate audio via Google Cloud TTS
 */
function callTTSAPI(text, voiceSettings, apiKey) {
  // Using Google Cloud Text-to-Speech API
  const url = 'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + apiKey;
  
  const payload = {
    input: { text: text },
    voice: {
      languageCode: voiceSettings.language || 'en-US',
      ssmlGender: 'FEMALE'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: voiceSettings.speakingRate || 1.0,
      pitch: voiceSettings.pitch || 0.0
    }
  };
  
  const options = {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) throw new Error('Google TTS Error: ' + response.getContentText());
  
  const result = JSON.parse(response.getContentText());
  const audioBlob = Utilities.newBlob(Utilities.base64Decode(result.audioContent), 'audio/mpeg', 'audio.mp3');
  return { success: true, blob: audioBlob, placeholder: false };
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function generateSceneImage(sceneDescription, title) {
  logMessage('Generating image for: ' + sceneDescription.substring(0, 50) + '...', 'INFO');
  
  const prompt = `Children book illustration, ${sceneDescription}, vibrant colors, cute style, detailed, 4k`;
  
  try {
    // API Key not needed for Pollinations, but passing empty string for compatibility
    return callImageGenerationAPI(prompt, '');
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function generateVoiceover(text, language) {
  logMessage('Generating voiceover (' + language + '): ' + text.substring(0, 50) + '...', 'INFO');
  
  try {
    const apiKey = getConfigValue('TTS_API_Key');
    if (!apiKey) throw new Error('TTS API Key not found');
    
    const settings = {
      language: language === 'bn' ? 'bn-IN' : 'en-US',
      speakingRate: 0.9
    };
    
    return callTTSAPI(text, settings, apiKey);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function generateSubtitles(story, language) {
  let srtContent = '';
  let currentTime = 0; // seconds
  const sceneDuration = 8; // Assumed seconds per scene
  
  for (let i = 0; i < story.scenes.length; i++) {
    const startTime = formatSrtTime(currentTime);
    const endTime = formatSrtTime(currentTime + sceneDuration);
    
    srtContent += (i + 1) + '\n';
    srtContent += startTime + ' --> ' + endTime + '\n';
    srtContent += story.scenes[i] + '\n\n';
    
    currentTime += sceneDuration;
  }
  
  return srtContent;
}

function formatSrtTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = 0;
  
  return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2) + ',' + pad(milliseconds, 3);
}

function pad(num, size) {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

// ========================================
// DRIVE HELPERS
// ========================================

function getOrCreateStoryFolder(storyTitle) {
  const mainFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  const baseName = sanitizeFilename(storyTitle);
  
  // Check if story folder already exists, if so create versioned folder
  const existingFolders = mainFolder.getFoldersByName(baseName);
  let storyFolder;
  
  if (!existingFolders.hasNext()) {
    // First time creating this story
    storyFolder = mainFolder.createFolder(baseName);
  } else {
    // Story exists, find next version number
    let version = 1;
    while (true) {
      const versionedName = baseName + '_' + version;
      const versionedFolders = mainFolder.getFoldersByName(versionedName);
      if (!versionedFolders.hasNext()) {
        storyFolder = mainFolder.createFolder(versionedName);
        break;
      }
      version++;
    }
  }
  
  // Create subfolders
  const imagesFolder = storyFolder.createFolder('images');
  const audioFolder = storyFolder.createFolder('audio');
  const subtitleFolder = storyFolder.createFolder('subtitle');
  
  return {
    main: storyFolder,
    images: imagesFolder,
    audio: audioFolder,
    subtitle: subtitleFolder
  };
}

function uploadToDrive(blob, filename, folder) {
  try {
    logMessage('Uploading to Drive: ' + filename, 'INFO');
    const file = folder.createFile(blob);
    file.setName(filename);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { success: true, url: file.getDownloadUrl(), fileId: file.getId() };
  } catch (error) {
    logMessage('Upload failed: ' + error.message, 'ERROR');
    return { success: false, error: error.message };
  }
}

function sanitizeFilename(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
}
