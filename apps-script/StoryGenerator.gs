/**
 * StoryGenerator.gs - Text Generation Logic
 * 
 * Uses Groq API (LLaMA models) for fast, free text generation
 */

// ========================================
// STORY EXPANSION
// ========================================

/**
 * Expand a simple story idea into a detailed storyboard
 * @param {string} idea - The core story concept
 * @param {string} moral - The moral of the story
 * @returns {object} Expanded story object with title and scenes
 */
function expandStory(idea, moral) {
  logMessage('Expanding story: ' + idea, 'INFO');
  
  const prompt = `
    You are a professional children's story writer.
    Create a 6-scene storyboard based on this idea: "${idea}"
    Moral: "${moral}"
    
    Output strictly in this JSON format:
    {
      "title": "A catchy title",
      "scenes": [
        "Scene 1 detailed description (visual + action)",
        "Scene 2...",
        "Scene 3...",
        "Scene 4...",
        "Scene 5...",
        "Scene 6..."
      ]
    }
    
    Keep scenes simple, visual, and suitable for children.
  `;
  
  try {
    const apiKey = getConfigValue('Text_API_Key');
    if (!apiKey) throw new Error('Text API Key not found in Config');
    
    const responseText = callTextGenerationAPI(prompt, apiKey);
    const storyData = parseJSONResponse(responseText);
    
    return storyData;
  } catch (error) {
    logMessage('Error expanding story: ' + error, 'ERROR');
    // Fallback for demo purposes if API fails
    return {
      title: "The " + idea.split(' ').slice(0, 2).join(' '),
      scenes: [
        `Once upon a time, there was a good character in a story about ${idea}.`,
        "The character faced a challenge that tested their values.",
        "They made a wise choice based on good principles.",
        "Their good deed was noticed by others.",
        "In the end, their honesty and kindness were rewarded.",
        `And they learned that ${moral}.`
      ]
    };
  }
}

/**
 * Translate story to Bengali
 * @param {object} story - Expanded story object
 * @returns {object} Translated story object
 */
function translateToBengali(story) {
  logMessage('Translating story to Bengali', 'INFO');
  
  const prompt = `
    Translate this children's story to simple, natural Bengali.
    
    Input JSON:
    ${JSON.stringify(story)}
    
    Output strictly in valid JSON format with same structure (title, scenes).
    Translate ONLY the values, keep keys in English.
  `;
  
  try {
    const apiKey = getConfigValue('Text_API_Key');
    const responseText = callTextGenerationAPI(prompt, apiKey);
    return parseJSONResponse(responseText);
  } catch (error) {
    logMessage('Error translating story: ' + error, 'ERROR');
    // Fallback
    return story;
  }
}

// ========================================
// API INTEGRATION (GROQ)
// ========================================

/**
 * Call Groq API for text generation
 * @param {string} prompt - Text prompt
 * @param {string} apiKey - API key
 * @returns {string} Generated text
 */
function callTextGenerationAPI(prompt, apiKey) {
  // Using Groq API - fast and free!
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const payload = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2048,
    response_format: { type: "json_object" } // Enforce JSON for better reliability
  };
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      throw new Error('Groq API Error (' + responseCode + '): ' + responseText);
    }
    
    const data = JSON.parse(responseText);
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error('Invalid response structure from Groq API: ' + responseText);
    }
    
  } catch (error) {
    logMessage('Text API Call Failed: ' + error.message, 'ERROR');
    throw error;
  }
}

/**
 * Helper to parse JSON from AI response (handles markdown code blocks)
 */
function parseJSONResponse(text) {
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    logMessage('JSON Parse Error: ' + e.message, 'ERROR');
    throw e;
  }
}
