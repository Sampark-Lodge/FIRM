# API Integration Guide

This guide provides detailed instructions and code examples for integrating your AI APIs with the ShishuKotha system.

## Overview

The system requires three types of AI APIs:

1. **Text Generation API** - For story ideas and script writing
2. **Image Generation API** - For scene illustrations
3. **Text-to-Speech API** - For voice narration

All API integration happens in Google Apps Script files. You need to replace the placeholder functions with actual API calls.

---

## 1. Text Generation API

### Recommended Free Options

| Service | Free Tier | Best For |
|---------|-----------|----------|
| [Google AI Studio (Gemini)](https://makersuite.google.com/) | 60 requests/min | Best free option, good multilingual support |
| [OpenAI](https://platform.openai.com/) | $5 trial credit | High quality, good for Bengali |
| [Hugging Face](https://huggingface.co/) | Free tier | Open models, unlimited with API key |
| [Cohere](https://cohere.com/) | 100 calls/min | Good for structured output |

### Integration Location

File: `apps-script/StoryGenerator.gs`  
Function: `callTextGenerationAPI(prompt, apiKey)`

### Example 1: Google Gemini API

```javascript
function callTextGenerationAPI(prompt, apiKey) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  
  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url + '?key=' + apiKey, options);
  const data = JSON.parse(response.getContentText());
  
  if (data.candidates && data.candidates[0]) {
    return data.candidates[0].content.parts[0].text;
  }
  
  throw new Error('Invalid response from Gemini API');
}
```

### Example 2: OpenAI GPT API

```javascript
function callTextGenerationAPI(prompt, apiKey) {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const payload = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a children\'s story writer creating moral stories for kids aged 5-10.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 1000,
    temperature: 0.7
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
  
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  if (data.choices && data.choices[0]) {
    return data.choices[0].message.content;
  }
  
  throw new Error('Invalid response from OpenAI API');
}
```

### Example 3: Hugging Face API

```javascript
function callTextGenerationAPI(prompt, apiKey) {
  const url = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1';
  
  const payload = {
    inputs: prompt,
    parameters: {
      max_new_tokens: 500,
      temperature: 0.7,
      return_full_text: false
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
  
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  if (Array.isArray(data) && data[0] && data[0].generated_text) {
    return data[0].generated_text;
  }
  
  throw new Error('Invalid response from Hugging Face API');
}
```

---

## 2. Image Generation API

### Recommended Free Options

| Service | Free Tier | Best For |
|---------|-----------|----------|
| [Hugging Face](https://huggingface.co/) | Unlimited (rate limited) | Best free option |
| [Stability AI](https://platform.stability.ai/) | 25 credits free | High quality |
| [Replicate](https://replicate.com/) | $5 credit | Many models available |

### Integration Location

File: `apps-script/MediaGenerator.gs`  
Function: `callImageGenerationAPI(prompt, apiKey)`

### Example 1: Hugging Face Stable Diffusion

```javascript
function callImageGenerationAPI(prompt, apiKey) {
  const url = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1';
  
  const payload = {
    inputs: prompt
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
  
  const response = UrlFetchApp.fetch(url, options);
  
  // Check if model is loading
  if (response.getResponseCode() === 503) {
    Utilities.sleep(5000); // Wait 5 seconds
    return callImageGenerationAPI(prompt, apiKey); // Retry
  }
  
  const imageBlob = response.getBlob();
  imageBlob.setName('generated_image.jpg');
  
  return {
    success: true,
    blob: imageBlob
  };
}
```

### Example 2: Stability AI API

```javascript
function callImageGenerationAPI(prompt, apiKey) {
  const url = 'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image';
  
  const payload = {
    text_prompts: [
      {
        text: prompt,
        weight: 1
      }
    ],
    cfg_scale: 7,
    height: 512,
    width: 512,
    samples: 1,
    steps: 30
  };
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  if (data.artifacts && data.artifacts[0]) {
    const base64Image = data.artifacts[0].base64;
    const imageBlob = Utilities.newBlob(
      Utilities.base64Decode(base64Image),
      'image/png',
      'generated_image.png'
    );
    
    return {
      success: true,
      blob: imageBlob
    };
  }
  
  throw new Error('Invalid response from Stability AI');
}
```

---

## 3. Text-to-Speech API

### Recommended Free Options

| Service | Free Tier | Best For |
|---------|-----------|----------|
| [Google Cloud TTS](https://cloud.google.com/text-to-speech) | 1M chars/month | Best quality, supports Bengali |
| [ElevenLabs](https://elevenlabs.io/) | 10k chars/month | Natural voices |
| [Play.ht](https://play.ht/) | 2500 words free | Good variety |

### Integration Location

File: `apps-script/MediaGenerator.gs`  
Function: `callTTSAPI(text, voiceSettings, apiKey)`

### Example 1: Google Cloud TTS

```javascript
function callTTSAPI(text, voiceSettings, apiKey) {
  const url = 'https://texttospeech.googleapis.com/v1/text:synthesize';
  
  const payload = {
    input: { text: text },
    voice: {
      languageCode: voiceSettings.language,
      ssmlGender: voiceSettings.gender
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: voiceSettings.speakingRate,
      pitch: voiceSettings.pitch
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
  
  const response = UrlFetchApp.fetch(url + '?key=' + apiKey, options);
  const data = JSON.parse(response.getContentText());
  
  if (data.audioContent) {
    const audioBlob = Utilities.newBlob(
      Utilities.base64Decode(data.audioContent),
      'audio/mp3',
      'voiceover.mp3'
    );
    
    return {
      success: true,
      blob: audioBlob
    };
  }
  
  throw new Error('Invalid response from Google TTS');
}
```

### Example 2: ElevenLabs API

```javascript
function callTTSAPI(text, voiceSettings, apiKey) {
  const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Default voice (Sarah)
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  
  const payload = {
    text: text,
    model_id: 'eleven_monolingual_v1',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5
    }
  };
  
  const options = {
    method: 'post',
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const audioBlob = response.getBlob();
  audioBlob.setName('voiceover.mp3');
  
  return {
    success: true,
    blob: audioBlob
  };
}
```

---

## Error Handling

### Recommended Pattern

```javascript
function callAPI(url, options, apiKey) {
  try {
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    
    // Handle different status codes
    if (statusCode === 200) {
      return JSON.parse(response.getContentText());
    } else if (statusCode === 429) {
      throw new Error('Rate limit exceeded. Please wait and try again.');
    } else if (statusCode === 401) {
      throw new Error('Invalid API key');
    } else if (statusCode === 503) {
      throw new Error('Service temporarily unavailable');
    } else {
      throw new Error(`API error: ${statusCode}`);
    }
  } catch (error) {
    logMessage('API Error: ' + error.message, 'ERROR');
    throw error;
  }
}
```

---

## Rate Limiting

### Strategy for Free Tiers

```javascript
// Add delay between API calls
function generateMultipleScenes(scenes) {
  const results = [];
  
  for (let i = 0; i < scenes.length; i++) {
    const result = generateSceneImage(scenes[i]);
    results.push(result);
    
    // Wait 2 seconds between calls to avoid rate limits
    if (i < scenes.length - 1) {
      Utilities.sleep(2000);
    }
  }
  
  return results;
}
```

---

## Testing Your Integration

### Test Text API

```javascript
function testTextAPI() {
  const apiKey = getConfigValue('Text_API_Key');
  const prompt = 'Generate a short children\'s story about honesty.';
  
  try {
    const result = callTextGenerationAPI(prompt, apiKey);
    Logger.log('✓ Text API working!');
    Logger.log(result);
  } catch (error) {
    Logger.log('✗ Text API failed: ' + error);
  }
}
```

### Test Image API

```javascript
function testImageAPI() {
  const apiKey =ConfigValue('Image_API_Key');
  const prompt = 'A friendly cartoon lion in a colorful forest';
  
  try {
    const result = callImageGenerationAPI(prompt, apiKey);
    
    if (result.success && result.blob) {
      // Save to Drive for verification
      const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
      folder.createFile(result.blob);
      Logger.log('✓ Image API working! Check your Drive folder.');
    }
  } catch (error) {
    Logger.log('✗ Image API failed: ' + error);
  }
}
```

### Test TTS API

```javascript
function testTTSAPI() {
  const apiKey = getConfigValue('TTS_API_Key');
  const text = 'Hello! This is a test of the text to speech system.';
  const voiceSettings = {
    language: 'en-US',
    gender: 'FEMALE',
    speakingRate: 1.0,
    pitch: 0.0
  };
  
  try {
    const result = callTTSAPI(text, voiceSettings, apiKey);
    
    if (result.success && result.blob) {
      const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
      folder.createFile(result.blob);
      Logger.log('✓ TTS API working! Check your Drive folder.');
    }
  } catch (error) {
    Logger.log('✗ TTS API failed: ' + error);
  }
}
```

---

## Troubleshooting

### Common Issues

**Issue**: "Invalid API key" error
- Verify the key is correct in Config sheet
- Check if key has proper permissions
- Ensure key is not expired

**Issue**: Rate limit errors
- Add `Utilities.sleep()` between calls
- Reduce batch sizes
- Upgrade to paid tier if needed

**Issue**: Model loading errors (Hugging Face)
- Wait and retry (model cold start)
- Implement retry logic with exponential backoff

**Issue**: Bengali text not working
- Verify API supports Bengali/Indic languages
- Use Google Cloud TTS for best Bengali support
- Check language code is correct (`bn-IN`)

---

## Best Practices

1. **Cache responses** when possible to reduce API calls
2. **Implement retry logic** for transient failures
3. **Monitor API usage** against your quotas
4. **Rotate API keys** periodically for security
5. **Use appropriate timeouts** to handle slow responses
6. **Log all API calls** for debugging

---

**Your API integration is now complete!** 🎉

Test each API individually before running the full pipeline.
