# ShishuKotha Setup Guide

Complete guide to setting up the ShishuKotha automated moral story video generation system.

## Prerequisites

- Google Account
- Google Drive with sufficient storage
- Free AI API keys (text generation, image generation, TTS)
- GitHub account (for hosting)
- Basic familiarity with Google Apps Script

## Step 1: Create Google Sheets

### 1.1 Create New Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it **"ShishuKotha Control"**
4. Copy the Spreadsheet ID from the URL (between `/d/` and `/edit`)
   - Example: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`

### 1.2 Create Required Sheets

Create three sheets with these exact names:

#### Sheet 1: Story_Ideas
| Sl | Idea | Moral | Approved | Status |
|----|------|-------|----------|--------|

#### Sheet 2: Generation_Log
| Date | Story_ID | Language | Status | Drive_Link | Version |
|------|----------|----------|--------|------------|---------|

#### Sheet 3: Config
| Key | Value |
|-----|-------|
| Trigger_Time | 06:00 |
| Max_Scenes | 6 |
| Aspect_Ratio | 9:16 |
| Text_API_Key | YOUR_KEY_HERE |
| Image_API_Key | YOUR_KEY_HERE |
| TTS_API_Key | YOUR_KEY_HERE |

See [SHEETS_TEMPLATE.md](SHEETS_TEMPLATE.md) for detailed structure and examples.

## Step 2: Setup Google Drive

### 2.1 Create Folder Structure

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder named **"ShishuKotha"**
3. Open the folder and copy the Folder ID from the URL
   - Example: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`

### 2.2 Set Sharing Permissions

1. Right-click the folder → Share
2. Change to "Anyone with the link can view"
3. Save

## Step 3: Setup Google Apps Script

### 3.1 Create Apps Script Project

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Delete the default `Code.gs` content

### 3.2 Add Script Files

Create the following files and copy the code from the `apps-script` folder:

1. **Code.gs** - Main orchestration
2. **WebApp.gs** - HTTP endpoints
3. **StoryGenerator.gs** - AI story generation
4. **MediaGenerator.gs** - Media generation
5. **Scheduler.gs** - Daily automation

To add files:
- Click the **+** next to Files
- Select "Script"
- Name it exactly as shown above
- Paste the corresponding code

### 3.3 Configure IDs

In **Code.gs**, update these values:

```javascript
SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',  // From Step 1.1
DRIVE_FOLDER_ID: 'YOUR_DRIVE_FOLDER_ID_HERE' // From Step 2.1
```

### 3.4 Run Setup

1. Select `setupSystem` from the function dropdown
2. Click **Run**
3. Authorize the script when prompted
4. Check execution log for success

### 3.5 Test Setup

1. Select `testSetup` from the function dropdown
2. Click **Run**
3. Verify all checks pass in the log

## Step 4: Deploy as Web App

### 4.1 Deploy

1. Click **Deploy** → **New deployment**
2. Click gear icon → **Web app**
3. Configure:
   - **Description**: ShishuKotha API
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Copy the Web App URL** - you'll need this for the dashboard

### 4.2 Note the URL

The URL will look like:
```
https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

Keep this URL safe - you'll use it in Step 6.

## Step 5: Configure API Keys

### 5.1 Get Free API Keys

You need three types of APIs:

#### Text Generation (Story Ideas & Scripts)
**Options:**
- [OpenAI](https://platform.openai.com/) - GPT-3.5/4 (free trial)
- [Google AI Studio](https://makersuite.google.com/) - Gemini (free)
- [Anthropic](https://www.anthropic.com/) - Claude (free trial)
- [Hugging Face](https://huggingface.co/) - Various models (free tier)

#### Image Generation (Scene Visuals)
**Options:**
- [Stability AI](https://platform.stability.ai/) - Stable Diffusion (free credits)
- [Hugging Face](https://huggingface.co/) - Stable Diffusion models (free)
- [Replicate](https://replicate.com/) - Various models (free credits)

#### Text-to-Speech (Voice Narration)
**Options:**
- [Google Cloud TTS](https://cloud.google.com/text-to-speech) - (free tier)
- [ElevenLabs](https://elevenlabs.io/) - (free tier)
- [Play.ht](https://play.ht/) - (free trial)

### 5.2 Add Keys to Config Sheet

1. Open your Google Sheet
2. Go to the **Config** sheet
3. Add your API keys in the Value column:
   - `Text_API_Key`: Your text generation key
   - `Image_API_Key`: Your image generation key
   - `TTS_API_Key`: Your TTS key

### 5.3 Integrate API Calls

> **IMPORTANT**: The Apps Script files contain **placeholder API functions**. You must update them with your actual API calls.

Edit these functions in the respective files:

**In StoryGenerator.gs:**
- `callTextGenerationAPI()` - Replace with your text API

**In MediaGenerator.gs:**
- `callImageGenerationAPI()` - Replace with your image API
- `callTTSAPI()` - Replace with your TTS API

See [API_INTEGRATION.md](API_INTEGRATION.md) for detailed examples.

## Step 6: Setup Dashboard

### 6.1 Clone Repository

```bash
git clone <your-repo-url>
cd lodge
```

Or download the project files.

### 6.2 Configure Web App URL

1. Open `js/api.js`
2. Update line 6:
```javascript
webAppUrl: 'YOUR_APPS_SCRIPT_WEB_APP_URL', // Replace with URL from Step 4
```

Or the dashboard will prompt you on first load.

### 6.3 Test Locally

Open `index.html` in a browser:

```bash
# Using Python
python -m http.server 8000

# Or just open the file
start index.html
```

The dashboard should load with demo data initially.

## Step 7: Deploy to GitHub Pages

### 7.1 Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Create a new repository named **"shishukotha"**
3. Keep it public for GitHub Pages

### 7.2 Push Code

```bash
git remote add origin https://github.com/YOUR_USERNAME/shishukotha.git
git add .
git commit -m "Initial commit - ShishuKotha system"
git push -u origin main
```

### 7.3 Enable GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Source: Deploy from branch
3. Branch: `main` / `(root)`
4. Save

Your dashboard will be available at:
```
https://YOUR_USERNAME.github.io/shishukotha/
```

## Step 8: Setup Daily Trigger

### 8.1 Install Trigger

1. Open Google Apps Script
2. Select `setupDailyTrigger` from dropdown
3. Click **Run**
4. Check log for confirmation

### 8.2 Verify Trigger

1. Click **Triggers** (clock icon) in left sidebar
2. Verify you see:
   - Function: `dailyGenerationJob`
   - Event: Time-driven, Day timer
   - Time: 6am-7am (IST)

## Step 9: Generate First Story

### 9.1 Add Test Story Ideas

Option 1 - Manual:
1. Open Google Sheets → Story_Ideas
2. Add sample ideas manually

Option 2 - Using Dashboard:
1. Open your dashboard
2. Click "Generate New Ideas"
3. Approve at least one idea

### 9.2 Approve Story

1. In the dashboard, find a pending story
2. Click "Approve"
3. Verify status changes to "Approved"

### 9.3 Trigger Manual Generation

1. Click "Start Generation Now" in Control Panel
2. Monitor the status section for progress
3. Check Google Drive for generated media files

## Troubleshooting

### Dashboard Shows "Failed to load"
- Verify Web App URL is correct in `api.js`
- Check Apps Script deployment is set to "Anyone"
- Open browser console for error messages

### API Errors
- Verify API keys are correct in Config sheet
- Check API rate limits
- Review Apps Script execution log for details

### No Files in Drive
- Verify Drive Folder ID is correct
- Check folder permissions
- Review execution log for upload errors

### Daily Trigger Not Running
- Check trigger is installed (Apps Script → Triggers)
- Verify timezone is set to Asia/Kolkata
- Check execution log for errors

## Next Steps

1. **Test the complete workflow** with a manual generation
2. **Configure your AI APIs** properly for real content
3. **Monitor the first few daily runs** to ensure stability
4. **Setup video assembly** using your preferred method (see note below)

## Important Notes

> **Video Assembly**: Google Apps Script cannot directly create MP4 videos. The system generates:
> - Images for each scene
> - Audio narration
> - Subtitles
> - Assembly instructions (JSON)
> 
> You'll need to use an external tool to combine these into final videos:
> - **FFmpeg** (via GitHub Actions or local script)
> - **Cloud video API** (Shotstack, Creatomate)
> - **Manual editing** (for testing)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Apps Script execution logs
3. Check browser console for frontend errors
4. Review the documentation in the `docs` folder

---

**Congratulations!** Your ShishuKotha system is now set up and ready to generate moral stories automatically! 🎉
