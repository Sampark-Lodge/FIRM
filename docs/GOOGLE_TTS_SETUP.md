# Google Cloud TTS API Setup Guide

## Step 1: Enable the API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Library**
4. Search for **"Cloud Text-to-Speech API"**
5. Click **Enable**

## Step 2: Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the API key (starts with `AIza...`)

## Step 3: Update Your Config

1. Open your Google Sheet (ShishuKotha Control)
2. Go to the **Config** tab
3. In the `TTS_API_Key` row, paste your new Google Cloud API key
4. Save

## Step 4: Test

1. In Apps Script, update `MediaGenerator.gs` with the new code
2. Run `testMediaPipeline`
3. You should see `Voice Status: SUCCESS`

## Free Tier Limits

- **1 million characters per month** (FREE!)
- Perfect for your daily story generation
- No credit card required for the free tier

## Notes

- This API supports both English and Bengali
- Better quality than ElevenLabs for most languages
- More reliable and won't get flagged
