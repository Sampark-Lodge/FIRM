/**
 * MediaGenerator.gs - Media Asset Generation
 * Handles image generation, voice narration, and Drive storage
 */

// ========================================
// IMAGE GENERATION
// ========================================

/**
 * Generate scene image using AI
 * @param {string} sceneDescription - Description of the scene
 * @param {string} storyTitle - Title of the story
 * @returns {object} Image data
 */
function generateSceneImage(sceneDescription, storyTitle) {
  // Defensive check for undefined scene
  if (!sceneDescription) {
    logMessage('Error: sceneDescription is undefined or null', 'ERROR');
    return {
      success: false,
      error: 'Scene description is missing',
      placeholder: true
    };
  }
  
  const descPreview = sceneDescription.substring(0, Math.min(50, sceneDescription.length));
  logMessage(`Generating image for: ${descPreview}...`, 'INFO');
  
  try {
    const apiKey = getConfigValue('Image_API_Key');
    
    if (!apiKey) {
      throw new Error('Image API Key not configured');
    }
    
    // Create child-friendly image prompt
    const prompt = `Children's storybook illustration: ${sceneDescription}. ` +
      `Style: colorful, cartoon, child-friendly, warm colors, simple shapes. ` +
      `Story: ${storyTitle}`;
    
    const imageData = callImageGenerationAPI(prompt, apiKey);
    
    return imageData;
  } catch (error) {
    logMessage('Error generating image: ' + error, 'ERROR');
    
    // Return placeholder
    return {
      success: false,
      error: error.message,
      placeholder: true
    };
  }
}

// ========================================
// VOICE GENERATION
// ========================================

/**
 * Generate voice narration using TTS
 * @param {string} text - Text to convert to speech
 * @param {string} language - Language code ('en' or 'bn')
 * @returns {object} Audio data
 */
function generateVoiceover(text, language) {
  // DEBUG LOGGING
  if (text === undefined) logMessage('DEBUG: text is UNDEFINED', 'ERROR');
  else if (text === null) logMessage('DEBUG: text is NULL', 'ERROR');
  else if (text === '') logMessage('DEBUG: text is EMPTY STRING', 'ERROR');
  else logMessage(`DEBUG: text type is ${typeof text}, length: ${text.length}`, 'INFO');

  // Defensive check for undefined text
  if (!text) {
    logMessage('Error: text is undefined or null in generateVoiceover', 'ERROR');
    return {
      success: false,
      error: 'Text is missing',
      placeholder: true
    };
  }
  
  const textPreview = text.substring(0, Math.min(50, text.length));
  logMessage(`Generating voiceover (${language}): ${textPreview}...`, 'INFO');
  
  try {
    const apiKey = getConfigValue('TTS_API_Key');
    
    if (!apiKey) {
      throw new Error('TTS API Key not configured');
    }
    
    // Determine voice settings based on language
    const voiceSettings = {
      language: language === 'bn' ? 'bn-IN' : 'en-US',
      gender: 'FEMALE',
      speakingRate: 0.9,
      pitch: 0.0
    };
    
    const audioData = callTTSAPI(text, voiceSettings, apiKey);
    
    return audioData;
  } catch (error) {
    logMessage('Error generating voiceover: ' + error, 'ERROR');
    
    return {
      success: false,
      error: error.message,
      placeholder: true
    };
  }
}

// ========================================
// DRIVE STORAGE
// ========================================

/**
 * Upload file to Google Drive
 * @param {Blob} blob - File blob
 * @param {string} filename - Filename
 * @param {string} folderDate - Date folder (YYYY-MM-DD)
 * @returns {object} File info
 */
function uploadToDrive(blob, filename, folderDate) {
  logMessage(`Uploading to Drive: ${filename}`, 'INFO');
  
  try {
    // Get or create date folder
    const dateFolder = getOrCreateDateFolder(folderDate);
    
    // Upload file
    const file = dateFolder.createFile(blob);
    file.setName(filename);
    
    // Set sharing permissions (anyone with link can view)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      success: true,
      fileId: file.getId(),
      url: file.getUrl(),
      downloadUrl: file.getDownloadUrl()
    };
  } catch (error) {
    logMessage('Error uploading to Drive: ' + error, 'ERROR');
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get or create date-based folder in Drive
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Folder} Drive folder
 */
function getOrCreateDateFolder(dateStr) {
  const mainFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  
  // Check if date folder exists
  const folders = mainFolder.getFoldersByName(dateStr);
  
  if (folders.hasNext()) {
    return folders.next();
  }
  
  // Create new date folder
  return mainFolder.createFolder(dateStr);
}

// ========================================
// MEDIA PACKAGE CREATION
// ========================================

/**
 * Create complete media package for a story
 * @param {object} story - Story object
 * @param {string} language - Language code
 * @returns {object} Media package metadata
 */
function createMediaPackage(story, language) {
  logMessage(`Creating media package: ${story.title} (${language})`, 'INFO');
  
  // Validate story structure
  if (!story || !story.title) {
    logMessage('Error: Invalid story object - missing title', 'ERROR');
    return {
      success: false,
      error: 'Invalid story structure'
    };
  }
  
  if (!story.scenes || !Array.isArray(story.scenes)) {
    logMessage(`Error: Invalid scenes - received: ${typeof story.scenes}`, 'ERROR');
    logMessage(`Story object: ${JSON.stringify(story)}`, 'ERROR');
    return {
      success: false,
      error: 'Story scenes missing or invalid'
    };
  }
  
  if (story.scenes.length === 0) {
    logMessage('Error: Story has no scenes', 'ERROR');
    return {
      success: false,
      error: 'No scenes to generate'
    };
  }
  
  const dateStr = getTodayDate();
  const mediaPackage = {
    storyTitle: story.title,
    language: language,
    date: dateStr,
    scenes: [],
    subtitles: null,
    success: true
  };
  
  try {
    // Generate media for each scene
    for (let i = 0; i < story.scenes.length; i++) {
      const scene = story.scenes[i];
      
      // Validate scene
      if (!scene || typeof scene !== 'string') {
        logMessage(`Warning: Scene ${i + 1} is invalid (type: ${typeof scene})`, 'ERROR');
        continue;
      }
      
      logMessage(`Processing scene ${i + 1}/${story.scenes.length}: ${scene.substring(0, 30)}...`, 'INFO');
      
      // Generate image
      const imageData = generateSceneImage(scene, story.title);
      let imageUrl = null;
      
      if (imageData.success && imageData.blob) {
        const imageFilename = `${sanitizeFilename(story.title)}_${language}_scene_${i + 1}.jpg`;
        const uploadResult = uploadToDrive(imageData.blob, imageFilename, dateStr);
        imageUrl = uploadResult.success ? uploadResult.url : null;
      }
      
      // Generate voiceover
      const audioData = generateVoiceover(scene, language);
      let audioUrl = null;
      
      if (audioData.success && audioData.blob) {
        const audioFilename = `${sanitizeFilename(story.title)}_${language}_audio_${i + 1}.mp3`;
        const uploadResult = uploadToDrive(audioData.blob, audioFilename, dateStr);
        audioUrl = uploadResult.success ? uploadResult.url : null;
      }
      
      mediaPackage.scenes.push({
        sceneNumber: i + 1,
        text: scene,
        imageUrl: imageUrl,
        audioUrl: audioUrl
      });
      
      // Small delay to avoid API rate limits
      sleep(1000);
    }
    
    // Generate and upload subtitles
    const subtitles = generateSubtitles(story, language);
    const subtitleBlob = Utilities.newBlob(subtitles, 'text/plain', 
      `${sanitizeFilename(story.title)}_${language}.srt`);
    
    const subtitleUpload = uploadToDrive(subtitleBlob, 
      `${sanitizeFilename(story.title)}_${language}.srt`, dateStr);
    
    if (subtitleUpload.success) {
      mediaPackage.subtitles = subtitleUpload.url;
    }
    
    // Create metadata file
    const metadataBlob = Utilities.newBlob(
      JSON.stringify(mediaPackage, null, 2),
      'application/json',
      `${sanitizeFilename(story.title)}_${language}_metadata.json`
    );
    
    const metadataUpload = uploadToDrive(metadataBlob,
      `${sanitizeFilename(story.title)}_${language}_metadata.json`, dateStr);
    
    if (metadataUpload.success) {
      mediaPackage.metadataUrl = metadataUpload.url;
    }
    
    logMessage('Media package created successfully', 'INFO');
    
    return mediaPackage;
  } catch (error) {
    logMessage('Error creating media package: ' + error, 'ERROR');
    
    mediaPackage.success = false;
    mediaPackage.error = error.message;
    
    return mediaPackage;
  }
}

// ========================================
// VIDEO ASSEMBLY (METADATA ONLY)
// ========================================

/**
 * Create video assembly instructions
 * NOTE: Apps Script cannot directly create MP4 videos.
 * This function creates instructions/metadata for external video assembly.
 * 
 * @param {object} mediaPackage - Media package
 * @returns {object} Assembly instructions
 */
function createVideoAssemblyInstructions(mediaPackage) {
  const instructions = {
    title: mediaPackage.storyTitle,
    language: mediaPackage.language,
    date: mediaPackage.date,
    aspectRatio: getConfigValue('Aspect_Ratio', CONFIG.DEFAULT_ASPECT_RATIO),
    scenes: mediaPackage.scenes.map(scene => ({
      sceneNumber: scene.sceneNumber,
      imageUrl: scene.imageUrl,
      audioUrl: scene.audioUrl,
      text: scene.text,
      duration: 8 // seconds
    })),
    subtitles: mediaPackage.subtitles,
    outputFilename: `${sanitizeFilename(mediaPackage.storyTitle)}_${mediaPackage.language}_v1.mp4`,
    
    notes: [
      'Use FFmpeg or video editing API to assemble',
      'Combine images with audio for each scene',
      'Add subtitles overlay',
      'Export as MP4 with specified aspect ratio'
    ]
  };
  
  // Upload instructions
  const dateStr = getTodayDate();
  const blob = Utilities.newBlob(
    JSON.stringify(instructions, null, 2),
    'application/json',
    `video_assembly_${mediaPackage.language}.json`
  );
  
  const upload = uploadToDrive(blob, `video_assembly_${mediaPackage.language}.json`, dateStr);
  
  return {
    success: upload.success,
    instructionsUrl: upload.url,
    instructions: instructions
  };
}

// ========================================
// AI API INTEGRATION (PLACEHOLDERS)
// ========================================

/**
 * Call image generation API
 * NOTE: PLACEHOLDER - Replace with your actual API integration
 * 
 * Example APIs:
 * - DALL-E (OpenAI)
 * - Stable Diffusion (Stability AI)
 * - Midjourney API
 * - Hugging Face Diffusion models
 * 
 * @param {string} prompt - Image prompt
 * @param {string} apiKey - API key
 * @returns {object} Image data with blob
 */
/**
 * Call Hugging Face API for image generation
 * @param {string} prompt - Image prompt
 * @param {string} apiKey - API key
 * @returns {object} Image data with blob
 */
function callImageGenerationAPI(prompt, apiKey) {
  // Use Stable Diffusion 3.5 Large (newer model) via router URL
  const url = 'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3.5-large';
  
  const payload = {
    inputs: prompt,
    options: {
      wait_for_model: true
    }
  };
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    
    // Check if model is loading (503)
    if (response.getResponseCode() === 503) {
      logMessage('Model loading, waiting 5 seconds...', 'INFO');
      Utilities.sleep(5000);
      return callImageGenerationAPI(prompt, apiKey); // Retry once
    }
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Hugging Face API Error: ${response.getContentText()}`);
    }
    
    const imageBlob = response.getBlob();
    return {
      success: true,
      blob: imageBlob,
      placeholder: false
    };
    
  } catch (error) {
    logMessage('Image API Call Failed: ' + error.message, 'ERROR');
    throw error;
  }
}

/**
 * Call TTS API
 * NOTE: PLACEHOLDER - Replace with your actual API integration
 * 
 * Example APIs:
 * - Google Cloud Text-to-Speech
 * - Amazon Polly
 * - Microsoft Azure TTS
 * - ElevenLabs
 * 
 * @param {string} text - Text to convert
 * @param {object} voiceSettings - Voice settings
 * @param {string} apiKey - API key
 * @returns {object} Audio data with blob
 */
/**
 * Call ElevenLabs API for Text-to-Speech
 * @param {string} text - Text to convert
 * @param {object} voiceSettings - Voice settings
 * @param {string} apiKey - API key
 * @returns {object} Audio data with blob
 */
function callTTSAPI(text, voiceSettings, apiKey) {
  // Default voice ID (Rachel) - Change as needed
  // Visit https://api.elevenlabs.io/v1/voices to see available voices
  const voiceId = '21m00Tcm4TlvDq8ikWAM'; 
  
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  
  const payload = {
    text: text,
    model_id: 'eleven_multilingual_v2', // Updated to newer model for free tier support
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5
    }
  };
  
  const options = {
    method: 'post',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`ElevenLabs API Error: ${response.getContentText()}`);
    }
    
    const audioBlob = response.getBlob();
    return {
      success: true,
      blob: audioBlob,
      placeholder: false
    };
    
  } catch (error) {
    logMessage('TTS API Call Failed: ' + error.message, 'ERROR');
    throw error;
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Sanitize filename for safe storage
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  // Defensive check for non-string input
  if (!filename || typeof filename !== 'string') {
    return 'untitled';
  }
  
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .substring(0, 50);
}

/**
 * Generate SRT subtitles content
 * @param {object} story - Story object
 * @param {string} language - Language code
 * @returns {string} SRT content
 */
function generateSubtitles(story, language) {
  let srtContent = '';
  let currentTime = 0; // seconds

  for (let i = 0; i < story.scenes.length; i++) {
    const sceneText = story.scenes[i];
    // Estimate 8 seconds per scene for now (can be adjusted based on actual audio duration if available)
    const duration = 8; 

    // Skip invalid scenes
    if (!sceneText || typeof sceneText !== 'string') continue;

    const startTime = formatSrtTime(currentTime);
    const endTime = formatSrtTime(currentTime + duration);

    srtContent += `${i + 1}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${sceneText}\n\n`;

    currentTime += duration;
  }

  return srtContent;
}

/**
 * Format time for SRT (HH:MM:SS,mmm)
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted string
 */
function formatSrtTime(seconds) {
  const date = new Date(0, 0, 0, 0, 0, 0, seconds * 1000);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');

  return `${hh}:${mm}:${ss},${ms}`;
}
