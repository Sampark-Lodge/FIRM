/**
 * StoryGenerator.gs - AI-Powered Story Generation
 * Handles story idea generation, expansion, and translation
 */

// ========================================
// STORY IDEA GENERATION
// ========================================

/**
 * Generate 10-15 story ideas with morals
 * @returns {number} Number of ideas generated
 */
function generateStoryIdeas() {
  logMessage('Generating new story ideas', 'INFO');
  
  try {
    const apiKey = getConfigValue('Text_API_Key');
    
    if (!apiKey) {
      throw new Error('Text API Key not configured');
    }
    
    // Generate ideas using AI API
    const ideas = callTextGenerationAPI(
      'Generate 10 moral story ideas for children aged 5-10. ' +
      'Each story should have a clear moral lesson. ' +
      'Format: IDEA: [story title] | MORAL: [moral lesson]',
      apiKey
    );
    
    // Parse and save ideas
    const count = parseAndSaveIdeas(ideas);
    
    logMessage(`Generated ${count} story ideas`, 'INFO');
    return count;
  } catch (error) {
    logMessage('Error generating ideas: ' + error, 'ERROR');
    
    // Fallback: Generate demo ideas
    return generateDemoIdeas();
  }
}

/**
 * Parse AI response and save ideas to sheet
 * @param {string} response - AI response
 * @returns {number} Number of ideas saved
 */
function parseAndSaveIdeas(response) {
  const sheet = getSheet(CONFIG.SHEETS.story_ideas);
  const lastRow = sheet.getLastRow();
  let nextId = lastRow > 0 ? lastRow : 1;
  
  // Split response into lines
  const lines = response.split('\n');
  let count = 0;
  
  for (const line of lines) {
    if (line.includes('IDEA:') && line.includes('MORAL:')) {
      const parts = line.split('|');
      const idea = parts[0].replace('IDEA:', '').trim();
      const moral = parts[1].replace('MORAL:', '').trim();
      
      if (idea && moral) {
        sheet.appendRow([nextId, idea, moral, 'No', 'Pending']);
        nextId++;
        count++;
      }
    }
  }
  
  return count;
}

/**
 * Generate demo story ideas (fallback)
 * @returns {number} Number of ideas generated
 */
function generateDemoIdeas() {
  const sheet = getSheet(CONFIG.SHEETS.story_ideas);
  const lastRow = sheet.getLastRow();
  let nextId = lastRow > 0 ? lastRow : 1;
  
  const demoIdeas = [
    ['The Honest Woodcutter', 'Honesty is always rewarded'],
    ['The Greedy Dog', 'Greed leads to loss'],
    ['The Ant and the Grasshopper', 'Hard work pays off'],
    ['The Kind Lion', 'Kindness is strength'],
    ['The Clever Crow', 'Intelligence solves problems'],
    ['The Tortoise and the Hare', 'Slow and steady wins the race'],
    ['The Boy Who Cried Wolf', 'Always tell the truth'],
    ['The Golden Goose', 'Be content with what you have'],
    ['The Fox and the Grapes', 'Don\'t make excuses for failure'],
    ['The Peacock and the Crane', 'True beauty comes from within']
  ];
  
  demoIdeas.forEach(([idea, moral]) => {
    sheet.appendRow([nextId, idea, moral, 'No', 'Pending']);
    nextId++;
  });
  
  return demoIdeas.length;
}

// ========================================
// STORY EXPANSION
// ========================================

/**
 * Expand a story idea into a scene-based script
 * @param {string} idea - Story idea/title
 * @param {string} moral - Moral lesson
 * @returns {object} Expanded story with scenes
 */
function expandStory(idea, moral) {
  logMessage(`Expanding story: ${idea}`, 'INFO');
  
  try {
    const apiKey = getConfigValue('Text_API_Key');
    const maxScenes = getConfigValue('Max_Scenes', CONFIG.DEFAULT_MAX_SCENES);
    
    if (!apiKey) {
      throw new Error('Text API Key not configured');
    }
    
    const prompt = `Create a children's moral story based on this idea:
Title: ${idea}
Moral: ${moral}

Requirements:
- Create ${maxScenes} scenes
- Each scene should be 2-3 sentences
- Simple language for children aged 5-10
- Clear moral lesson at the end
- Format each scene as: SCENE [number]: [description]`;
    
    const response = callTextGenerationAPI(prompt, apiKey);
    
    return parseStoryScenes(response, idea, moral);
  } catch (error) {
    logMessage('Error expanding story: ' + error, 'ERROR');
    
    // Return demo story
    return createDemoStory(idea, moral);
  }
}

/**
 * Parse story response into scenes
 * @param {string} response - AI response
 * @param {string} title - Story title
 * @param {string} moral - Moral lesson
 * @returns {object} Story object
 */
function parseStoryScenes(response, title, moral) {
  const scenes = [];
  const lines = response.split('\n');
  
  for (const line of lines) {
    if (line.trim().startsWith('SCENE')) {
      const sceneText = line.substring(line.indexOf(':') + 1).trim();
      if (sceneText) {
        scenes.push(sceneText);
      }
    }
  }
  
  return {
    title: title,
    moral: moral,
    scenes: scenes,
    language: 'en'
  };
}

/**
 * Create demo story (fallback)
 * @param {string} title - Story title
 * @param {string} moral - Moral lesson
 * @returns {object} Story object
 */
function createDemoStory(title, moral) {
  return {
    title: title,
    moral: moral,
    scenes: [
      'Once upon a time, there was a good character in a peaceful village.',
      'The character faced a challenge that tested their values.',
      'They made a wise choice based on good principles.',
      'Their good deed was noticed by others.',
      'In the end, their honesty and kindness were rewarded.',
      `And they learned that ${moral.toLowerCase()}.`
    ],
    language: 'en'
  };
}

// ========================================
// TRANSLATION
// ========================================

/**
 * Translate story to Bengali
 * @param {object} story - Story object
 * @returns {object} Translated story
 */
function translateToBengali(story) {
  logMessage('Translating story to Bengali', 'INFO');
  
  try {
    const apiKey = getConfigValue('Text_API_Key');
    
    if (!apiKey) {
      throw new Error('Text API Key not configured');
    }
    
    const prompt = `Translate this children's story to Bengali. Maintain the scene structure:

Title: ${story.title}
Moral: ${story.moral}

Scenes:
${story.scenes.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Provide translation in same format with SCENE [number]: [Bengali text]`;
    
    const response = callTextGenerationAPI(prompt, apiKey);
    
    return parseStoryScenes(response, story.title, story.moral);
  } catch (error) {
    logMessage('Error translating story: ' + error, 'ERROR');
    
    // Return original with language marker
    return {
      ...story,
      language: 'bn',
      note: 'Translation API unavailable - using demo data'
    };
  }
}

// ========================================
// SUBTITLE GENERATION
// ========================================

/**
 * Generate subtitles in SRT format
 * @param {object} story - Story object
 * @param {string} language - Language code
 * @returns {string} SRT formatted subtitles
 */
function generateSubtitles(story, language) {
  let srt = '';
  let startTime = 0;
  const durationPerScene = 8; // seconds
  
  story.scenes.forEach((scene, index) => {
    const endTime = startTime + durationPerScene;
    
    srt += `${index + 1}\n`;
    srt += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
    srt += `${scene}\n\n`;
    
    startTime = endTime;
  });
  
  return srt;
}

/**
 * Format time for SRT (HH:MM:SS,mmm)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// ========================================
// AI API INTEGRATION (PLACEHOLDER)
// ========================================

/**
 * Call text generation API
 * NOTE: This is a PLACEHOLDER function. Replace with your actual API integration.
 * 
 * Example APIs you can use:
 * - OpenAI GPT API
 * - Google Gemini API  
 * - Hugging Face API
 * - Cohere API
 * 
 * @param {string} prompt - Text prompt
 * @param {string} apiKey - API key
 * @returns {string} Generated text
 */
/**
 * Call Google Gemini API for text generation
 * @param {string} prompt - Text prompt
 * @param {string} apiKey - API key
 * @returns {string} Generated text
 */
function callTextGenerationAPI(prompt, apiKey) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=' + apiKey;
  
  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      throw new Error(`Gemini API Error (${responseCode}): ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response structure from Gemini API: ' + responseText);
    }
    
  } catch (error) {
    logMessage('Text API Call Failed: ' + error.message, 'ERROR');
    throw error;
  }
}
