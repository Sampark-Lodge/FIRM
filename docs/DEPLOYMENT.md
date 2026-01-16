# Deployment Guide

Complete guide for deploying the ShishuKotha system to production.

## Prerequisites

Before deploying, ensure you have completed:

- ✅ [SETUP.md](SETUP.md) - Basic system setup
- ✅ [SHEETS_TEMPLATE.md](SHEETS_TEMPLATE.md) - Google Sheets configured
- ✅ [API_INTEGRATION.md](API_INTEGRATION.md) - APIs integrated and tested

## Deployment Checklist

### Pre-Deployment

- [ ] All API keys tested and working
- [ ] Google Sheets properly configured
- [ ] Drive folder created with correct permissions
- [ ] Apps Script tested with `testSetup()`
- [ ] At least 5 approved story ideas in sheet
- [ ] All placeholder API functions replaced with real implementations

### Deployment Steps

## 1. Deploy Google Apps Script

### 1.1 Final Testing

```javascript
// Run these tests in Apps Script console:
testSetup()        // Verify basic setup
testTextAPI()      // Test text generation
testImageAPI()     // Test image generation
testTTSAPI()       // Test TTS
```

All tests should pass before deploying.

### 1.2 Deploy as Web App

1. Open Apps Script project
2. Click **Deploy** → **New deployment**
3. Select type: **Web app**
4. Configure:
   - **Description**: ShishuKotha Production v1.0
   - **Execute as**: Me (your account)
   - **Who has access**: Anyone
5. Click **Deploy**
6. **Copy the deployment URL**
7. Approve permissions when prompted

#### Important Permission Notes

When deploying, you'll need to grant permissions:
- ✅ Google Sheets access (read/write)
- ✅ Google Drive access (file creation)
- ✅ External API calls (UrlFetchApp)

Click "Advanced" → "Go to ShishuKotha (unsafe)" if warned about unverified app.

### 1.3 Note the Web App URL

Your URL will look like:
```
https://script.google.com/macros/s/AKfycbx.../exec
```

Keep this URL - you'll need it for the dashboard.

## 2. Setup Daily Trigger

### 2.1 Install Trigger

Run this function in Apps Script:
```javascript
setupDailyTrigger()
```

### 2.2 Verify Trigger

1. Click **Triggers** (clock icon) in sidebar
2. Verify trigger details:
   - Function: `dailyGenerationJob`
   - Event source: Time-driven
   - Type: Day timer
   - Time of day: 6am to 7am
   - Time zone: (GMT+05:30) Asia/Kolkata

### 2.3 Trigger Permissions

Grant the trigger permissions to:
- Execute when you're not present
- Send emails (for error notifications)

## 3. Deploy Frontend Dashboard

### 3.1 Configure Dashboard

Update `js/api.js`:

```javascript
const API_CONFIG = {
    webAppUrl: 'YOUR_WEB_APP_URL_HERE', // From step 1.3
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
};
```

### 3.2 Test Locally First

```bash
# Using Python
python -m http.server 8000

# Open browser
http://localhost:8000
```

Verify:
- [ ] Dashboard loads without errors
- [ ] API connection successful
- [ ] Story ideas display correctly
- [ ] All buttons functional

### 3.3 Push to GitHub

```bash
# Initialize repository (if not done)
git init
git add .
git commit -m "ShishuKotha production deployment"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/shishukotha.git

# Push
git push -u origin main
```

### 3.4 Enable GitHub Pages

1. Go to repository **Settings**
2. Navigate to **Pages** section
3. Source: **Deploy from a branch**
4. Branch: **main** / **/(root)**
5. Save

GitHub will deploy your site to:
```
https://YOUR_USERNAME.github.io/shishukotha/
```

### 3.5 Wait for Deployment

- Usually takes 1-2 minutes
- Check **Actions** tab for deployment status
- Green checkmark = successful deployment

## 4. Post-Deployment Testing

### 4.1 Test Web Dashboard

Visit your GitHub Pages URL and verify:

- [ ] Page loads successfully
- [ ] API connectivity shows "online"
- [ ] Story ideas load from Google Sheets
- [ ] Status section displays correctly
- [ ] All interactive features work
  - [ ] Approve/reject stories
  - [ ] Manual trigger
  - [ ] Regenerate buttons
  - [ ] Refresh button

### 4.2 Test Manual Generation

1. Click "Start Generation Now"
2. Monitor the status bar
3. Check Google Drive for generated files
4. Verify Generation_Log updated
5. Check all media files created:
   - Images for each scene
   - Audio files
   - Subtitles (SRT)
   - Metadata JSON
   - Assembly instructions

### 4.3 Test Daily Trigger

Option 1 - Wait for scheduled time (06:00 AM IST)

Option 2 - Manually trigger:
```javascript
// Run in Apps Script
dailyGenerationJob()
```

Verify:
- [ ] Script executes successfully
- [ ] Videos generated
- [ ] Log updated
- [ ] Files in Drive
- [ ] No errors in execution log

## 5. Monitoring Setup

### 5.1 Enable Email Notifications

Add to `Code.gs`:

```javascript
function handleError(error, context) {
  const errorMessage = `Error in ${context}: ${error.message}`;
  logMessage(errorMessage, 'ERROR');
  
  // Send email notification
  try {
    MailApp.sendEmail({
      to: 'your.email@example.com', // Replace with your email
      subject: '⚠️ ShishuKotha Error Alert',
      body: `An error occurred in ShishuKotha:\n\nContext: ${context}\nError: ${error.message}\nTime: ${getCurrentTimestamp()}\n\nPlease check the execution logs for details.`
    });
  } catch (e) {
    Logger.log('Failed to send error email: ' + e);
  }
  
  return {
    success: false,
    error: error.message,
    context: context
  };
}
```

### 5.2 Monitor Apps Script Executions

1. Go to Apps Script project
2. Click **Executions** (play icon with list)
3. View execution history
4. Check for errors or failures

### 5.3 Setup Drive Alerts

1. Right-click ShishuKotha folder in Drive
2. Get notifications → All changes
3. Receive email when files are added

## 6. Performance Optimization

### 6.1 Batch Operations

If generating many videos, consider batching:

```javascript
function runWeeklyBatch() {
  const stories = getApprovedStories(7); // Get 7 stories
  
  stories.forEach((story, index) => {
    try {
      generateForStory(story);
      
      // Space out generation to avoid timeouts
      if (index < stories.length - 1) {
        Utilities.sleep(60000); // Wait 1 minute between stories
      }
    } catch (error) {
      logMessage(`Batch error for ${story.idea}: ${error}`, 'ERROR');
    }
  });
}
```

### 6.2 Caching

Implement caching for repeated API calls:

```javascript
const cache = CacheService.getScriptCache();

function getCachedOrFetch(key, fetchFunction, ttl = 3600) {
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  
  const result = fetchFunction();
  cache.put(key, JSON.stringify(result), ttl);
  return result;
}
```

## 7. Security Hardening

### 7.1 Move API Keys to Script Properties

Instead of Config sheet:

```javascript
// Set once via Apps Script console
function setupProperties() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    'TEXT_API_KEY': 'your-text-key',
    'IMAGE_API_KEY': 'your-image-key',
    'TTS_API_KEY': 'your-tts-key'
  });
}

// Then update getConfigValue():
function getConfigValue(key, defaultValue = null) {
  if (key.includes('API_Key')) {
    return PropertiesService.getScriptProperties().getProperty(key.toUpperCase());
  }
  
  // Regular config from sheet
  const sheet = getSheet(CONFIG.SHEETS.config);
  // ... existing code
}
```

### 7.2 Restrict Web App Access

For added security, change Web App access:
- **Who has access**: Only myself
- Use API key authentication for dashboard

Add to `doGet()`:
```javascript
function doGet(e) {
  const apiKey = e.parameter.apiKey;
  if (apiKey !== getConfigValue('DASHBOARD_API_KEY')) {
    return createResponse({ error: 'Unauthorized' });
  }
  // ... rest of function
}
```

### 7.3 Enable CORS Properly

Apps Script handles CORS automatically, but verify:

```javascript
function doGet(e) {
  const output = // ... your normal response
  return output
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST');
}
```

## 8. Backup Strategy

### 8.1 Automated Backups

Create weekly backup:

```javascript
function createBackup() {
  const ss = getSpreadsheet();
  const backupFolder = DriveApp.getFolder('BACKUP_FOLDER_ID');
  const date = getTodayDate();
  
  const backup = ss.copy(`ShishuKotha_Backup_${date}`);
  backup.moveTo(backupFolder);
  
  logMessage('Backup created: ' + backup.getName(), 'INFO');
}

// Setup trigger
function setupBackupTrigger() {
  ScriptApp.newTrigger('createBackup')
    .timeBased()
    .onWeeklyBasis()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(1)
    .create();
}
```

### 8.2 Export Generation Log

Monthly export to CSV:

```javascript
function exportLogToCSV() {
  const sheet = getSheet(CONFIG.SHEETS.generation_log);
  const data = sheet.getDataRange().getValues();
  
  const csv = data.map(row => row.join(',')).join('\n');
  const blob = Utilities.newBlob(csv, 'text/csv', `log_${getTodayDate()}.csv`);
  
  const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  folder.createFile(blob);
}
```

## 9. Maintenance Schedule

### Daily
- Monitor execution logs
- Check error notifications
- Verify video generation completed

### Weekly
- Review generated content quality
- Approve new story ideas
- Check API usage against quotas
- Archive old Drive files

### Monthly
- Rotate API keys
- Review and optimize performance
- Export backups
- Clean up old log entries

## 10. Troubleshooting Production Issues

### Issue: Daily trigger not running

**Check:**
1. Trigger still exists (Apps Script → Triggers)
2. No execution errors in log
3. Account hasn't lost permissions

**Fix:**
```javascript
// Delete and recreate trigger
removeAllTriggers()
setupDailyTrigger()
```

### Issue: API quota exceeded

**Temporary fix:**
- Add delays between calls
- Reduce Max_Scenes in config

**Long-term fix:**
- Upgrade to paid API tier
- Implement request pooling

### Issue: Dashboard not updating

**Check:**
1. Web App deployment is latest version
2. CORS headers correct
3. Browser console for errors

**Fix:**
- Redeploy Apps Script
- Clear browser cache
- Check API endpoint URL

---

## Production Checklist

Before going live:

- [ ] All tests passing
- [ ] APIs integrated and tested
- [ ] Daily trigger installed and verified
- [ ] Dashboard deployed to GitHub Pages
- [ ] Error notifications configured
- [ ] Backup strategy in place
- [ ] Monitoring setup complete
- [ ] Documentation reviewed
- [ ] At least one full generation cycle successful

---

**Your ShishuKotha system is now in production!** 🚀

Monitor the first few days closely to catch any issues early.
