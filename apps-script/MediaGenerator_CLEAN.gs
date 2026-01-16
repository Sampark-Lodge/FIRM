/**
 * MediaGenerator.gs - Media Asset Generation
 * Handles image generation, voice narration, and Drive storage
 */

// ========================================
// IMAGE GENERATION
// ========================================

function generateSceneImage(sceneDescription, storyTitle) {
  if (!sceneDescription) {
    logMessage('Error: sceneDescription is undefined or null', 'ERROR');
    return { success: false, error: 'Scene description is missing', placeholder: true };
  }
  
  const descPreview = sceneDescription.substring(0, Math.min(50, sceneDescription.length));
  logMessage('Generating image for: ' + descPreview + '...', 'INFO');
  
  try {
    const apiKey = getConfigValue('Image_API_Key');
    if (!apiKey) throw new Error('Image API Key not configured');
    
    // Create prompt
    const prompt = "Children's storybook illustration: " + sceneDescription + ". " +
      "Style: colorful, cartoon, child-friendly, warm colors, simple shapes. " +
      "Story: " + storyTitle;
    
    return callImageGenerationAPI(prompt, apiKey);
  } catch (error) {
    logMessage('Error generating image: ' + error, 'ERROR');
    return { success: false, error: error.message, placeholder: true };
  }
}

// ========================================
// VOICE GENERATION
// ========================================

function generateVoiceover(text, language) {
  if (!text) {
    logMessage('Error: text is undefined or null in generateVoiceover', 'ERROR');
    return { success: false, error: 'Text is missing', placeholder: true };
  }
  
  const textPreview = text.substring(0, Math.min(50, text.length));
  logMessage('Generating voiceover (' + language + '): ' + textPreview + '...', 'INFO');
  
  try {
    const apiKey = getConfigValue('TTS_API_Key');
    if (!apiKey) throw new Error('TTS API Key not configured');
    
    const voiceSettings = {
      language: language === 'bn' ? 'bn-IN' : 'en-US',
      gender: 'FEMALE',
      speakingRate: 0.9,
      pitch: 0.0
    };
    
    return callTTSAPI(text, voiceSettings, apiKey);
  } catch (error) {
    logMessage('Error generating voiceover: ' + error, 'ERROR');
    return { success: false, error: error.message, placeholder: true };
  }
}

// ========================================
// DRIVE STORAGE
// ========================================

function uploadToDrive(blob, filename, targetFolder) {
  logMessage('Uploading to Drive: ' + filename, 'INFO');
  try {
    const file = targetFolder.createFile(blob);
    file.setName(filename);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      success: true,
      fileId: file.getId(),
      url: file.getUrl(),
      downloadUrl: file.getDownloadUrl()
    };
  } catch (error) {
    logMessage('Error uploading to Drive: ' + error, 'ERROR');
    return { success: false, error: error.message };
  }
}

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

// ========================================
// MEDIA PACKAGE CREATION
// ========================================

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
      
      // Image
      const imageData = generateSceneImage(scene, story.title);
      let imageUrl = null;
      if (imageData.success && imageData.blob) {
        const imageFilename = language + '_scene_' + (i + 1) + '.jpg';
        const uploadResult = uploadToDrive(imageData.blob, imageFilename, folders.images);
        imageUrl = uploadResult.success ? uploadResult.url : null;
      } else {
        logMessage('Skipping image for scene ' + (i + 1) + ' (API unavailable)', 'INFO');
      }
      
      // Voice
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
      
      sleep(1000);
    }
    
    // Subtitles
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
// VIDEO ASSEMBLY (METADATA)
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
// UTILITIES
// ========================================

function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'untitled';
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
}

function generateSubtitles(story, language) {
  let srt = '';
  let time = 0;
  for (let i = 0; i < story.scenes.length; i++) {
    const text = story.scenes[i];
    if (!text || typeof text !== 'string') continue;
    const start = formatSrtTime(time);
    const end = formatSrtTime(time + 8);
    srt += (i + 1) + '\n' + start + ' --> ' + end + '\n' + text + '\n\n';
    time += 8;
  }
  return srt;
}

function formatSrtTime(seconds) {
  const date = new Date(0, 0, 0, 0, 0, 0, seconds * 1000);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return hh + ':' + mm + ':' + ss + ',' + ms;
}
