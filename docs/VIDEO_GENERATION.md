# 🎬 Video Generation Guide

## How the System Works

The ShishuKotha system generates videos in **two stages**:

### ✅ Stage 1: Media Generation (Automated)
**What it does:**
- Generates story scenes using Gemini AI
- Creates images for each scene using Hugging Face
- Generates voiceovers using ElevenLabs TTS
- Creates subtitle files (.srt)
- Uploads everything to Google Drive
- Creates a metadata JSON file

**How to trigger:**
1. **Approve** at least one story idea from the dashboard
2. Click **"Start Generation Now"** in the Control Panel
3. Wait 5-10 minutes

**What you'll get in Google Drive:**
```
ShishuKotha/
└── 2026-01-15/
    ├── the_honest_woodcutter_bn_scene_1.jpg
    ├── the_honest_woodcutter_bn_audio_1.mp3
    ├── the_honest_woodcutter_bn.srt
    ├── the_honest_woodcutter_bn_metadata.json
    ├── video_assembly_bn.json
    └── (same for English version)
```

### ⚠️ Stage 2: Video Assembly (Manual - Apps Script Limitation)

**The Problem:**
Google Apps Script **cannot create MP4 video files**. It can only generate the raw assets (images, audio, subtitles).

**Your Options:**

#### Option 1: Manual Assembly (Easy)
Use any video editing software:
1. Import images from Drive
2. Add audio tracks
3. Set each scene duration to match audio length
4. Add subtitle overlay
5. Export as MP4

**Recommended Tools:**
- **CapCut** (Free, beginner-friendly)
- **DaVinci Resolve** (Free, professional)
- **Adobe Premiere Pro** (Paid)

#### Option 2: Python FFmpeg Script (Automated)
I can create a Python script that:
1. Downloads assets from Google Drive
2. Uses FFmpeg to combine images + audio
3. Burns in subtitles
4. Exports final MP4
5. Re-uploads to Drive

**Requirements:**
- Python installed
- FFmpeg installed
- Google Drive API credentials

Would you like me to create this script?

#### Option 3: External Video API (Advanced)
Integrate services like:
- **Remotion** (React-based video rendering)
- **Shotstack** (Video API service)
- **Creatomate** (Template-based video API)

These can be triggered by the Apps Script after media generation.

---

## Testing the Media Generation

### Quick Test:
1. Go to your dashboard
2. Make sure you have **at least 1 approved story idea**
3. Click **"Start Generation Now"**
4. Monitor the status indicator at the top
5. Check your Google Drive folder after 5-10 minutes

### Verify in Google Drive:
- You should see a new date folder (e.g., `2026-01-15`)
- Inside: images (`.jpg`), audio (`.mp3`), subtitles (`.srt`), metadata (`.json`)

### If it fails:
- Check the **Generation Log** on the dashboard
- Open Apps Script **Execution log** for detailed errors
- Verify all API keys are valid

---

## What Happens During Generation?

1. **Story Selection:** Picks the first approved story from the queue
2. **Story Expansion:** Gemini expands the idea into 5-7 scenes
3. **Translation:** Creates both Bengali and English versions
4. **Image Generation:** Hugging Face creates an illustration for each scene
5. **Voice Generation:** ElevenLabs creates narration audio
6. **Subtitle Creation:** Generates .srt files with timestamps
7. **Drive Upload:** All assets uploaded to date-stamped folder
8. **Metadata Creation:** JSON files for external assembly tools
9. **Status Update:** Dashboard shows "Generated" status

---

## Daily Automation

Once you confirm everything works, the system will:
- Run automatically every day at **6:00 AM** (configurable)
- Pick one approved story
- Generate media for both languages
- Update the dashboard

You just need to:
1. Keep approving story ideas
2. Occasionally check the dashboard
3. Assemble final videos manually (or use a script)

---

## Need Help?

**Want the Python FFmpeg script?** Let me know and I'll create it for you!

**Want to change the schedule?** I can show you how to modify the daily trigger time.

**Want better control over scene count?** The prompts can be adjusted in `StoryGenerator.gs`.
