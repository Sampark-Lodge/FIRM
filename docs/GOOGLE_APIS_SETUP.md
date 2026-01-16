# Google AI Studio (Gemini) Setup - Complete Guide

You'll use **ONE API key** for both text generation and image generation!

## Step 1: Get Your API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Get API Key"**
3. Select your Google Cloud project (or create a new one)
4. Click **"Create API Key"**
5. Copy the key (starts with `AIza...`)

## Step 2: Update Your Config Sheet

1. Open your Google Sheet (**ShishuKotha Control**)
2. Go to the **Config** tab
3. Update these rows with your API key:
   - `Text_API_Key` → Paste your Gemini API key
   - `Image_API_Key` → Paste the **SAME** Gemini API key
   - `TTS_API_Key` → Paste your **Google Cloud TTS** API key (different service)

## Step 3: Enable Required APIs

In [Google Cloud Console](https://console.cloud.google.com/):

### For Text & Images (Gemini):
- Already enabled if you created the key in AI Studio ✓

### For Voice (TTS):
1. Go to **APIs & Services** → **Library**
2. Search **"Cloud Text-to-Speech API"**
3. Click **Enable**
4. Go to **Credentials** → **Create API Key** (if you haven't already)
5. This is your TTS key (different from Gemini key)

## Step 4: Test Everything

1. Update `MediaGenerator.gs` in Apps Script with the new code
2. Save
3. Run `testMediaPipeline`
4. You should see:
   - ✅ Image Status: SUCCESS
   - ✅ Voice Status: SUCCESS

## API Limits (FREE Tier)

### Gemini (Text + Images):
- **60 requests per minute**
- **1,500 requests per day**
- Perfect for daily story generation!

### Google Cloud TTS:
- **1 million characters per month**
- More than enough for unlimited stories!

## Summary

You need **TWO API keys total**:
1. **Gemini API Key** (from AI Studio) → For text + images
2. **Google Cloud TTS API Key** (from Cloud Console) → For voice

Both are from Google, both are FREE, both are reliable! 🚀
