# Google Sheets Template Guide

This document provides the exact structure and examples for all Google Sheets used in the ShishuKotha system.

## Sheet 1: Story_Ideas

**Purpose**: Store all story ideas with approval status

**Columns**:
| Column | Name | Type | Description | Example |
|--------|------|------|-------------|---------|
| A | Sl | Number | Serial number (unique ID) | 1 |
| B | Idea | Text | Story title/idea | The Honest Woodcutter |
| C | Moral | Text | Moral lesson | Honesty is always rewarded |
| D | Approved | Text | Approval status (Yes/No) | Yes |
| E | Status | Text | Generation status | Pending |

**Example Data**:
```
Sl | Idea                        | Moral                           | Approved | Status
---|-----------------------------|---------------------------------|----------|----------
1  | The Honest Woodcutter       | Honesty is always rewarded      | Yes      | Pending
2  | The Greedy Dog              | Greed leads to loss             | No       | Pending
3  | The Ant and the Grasshopper | Hard work pays off              | Yes      | Generated
4  | The Kind Lion               | Kindness is strength            | Yes      | Pending
5  | The Clever Crow             | Intelligence solves problems    | No       | Pending
```

**Status Values**:
- `Pending` - Waiting to be generated
- `Generated` - Already used for video generation
- Leave blank for new ideas

**Approval Values**:
- `Yes` - Approved for generation
- `No` - Not approved (default for new ideas)

**Formatting Tips**:
- Add data validation for Approved column: List from range `Yes,No`
- Conditional formatting:
  - Approved = Yes → Green background
  - Approved = No → Yellow background
  - Status = Generated → Gray background

---

## Sheet 2: Generation_Log

**Purpose**: Track all video generation history

**Columns**:
| Column | Name | Type | Description | Example |
|--------|------|------|-------------|---------|
| A | Date | Date | Generation date | 2026-01-14 |
| B | Story_ID | Text | Story title | The Honest Woodcutter |
| C | Language | Text | Languages generated | BN, EN |
| D | Status | Text | Generation status | Generated |
| E | Drive_Link | URL | Link to Drive folder | https://drive.google.com/... |
| F | Version | Text | Version number | v1 |

**Example Data**:
```
Date       | Story_ID              | Language | Status     | Drive_Link                | Version
-----------|-----------------------|----------|------------|---------------------------|--------
2026-01-14 | The Honest Woodcutter | BN, EN   | Generated  | https://drive.google.com/ | v1
2026-01-15 | The Kind Lion         | BN, EN   | Generated  | https://drive.google.com/ | v1
2026-01-15 | The Kind Lion         | EN       | Regenerated| https://drive.google.com/ | v2
2026-01-16 | The Clever Crow       | BN, EN   | Failed     | N/A                       | v1
```

**Status Values**:
- `Generated` - Successfully generated
- `Regenerated` - Manually regenerated
- `Failed` - Generation failed
- `Pending` - In progress

**Formatting Tips**:
- Format Date column as Date
- Conditional formatting:
  - Status = Generated → Green text
  - Status = Failed → Red text
  - Status = Regenerated → Orange text

---

## Sheet 3: Config

**Purpose**: Store system configuration and API keys

**Columns**:
| Column | Name | Type | Description |
|--------|------|------|-------------|
| A | Key | Text | Configuration key |
| B | Value | Text | Configuration value |

**Required Configuration**:
```
Key              | Value
-----------------|------------------
Trigger_Time     | 06:00
Max_Scenes       | 6
Aspect_Ratio     | 9:16
Text_API_Key     | your-text-api-key-here
Image_API_Key    | your-image-api-key-here
TTS_API_Key      | your-tts-api-key-here
```

**Configuration Descriptions**:

| Key | Description | Default | Options |
|-----|-------------|---------|---------|
| `Trigger_Time` | Daily generation time (IST) | 06:00 | HH:MM format |
| `Max_Scenes` | Number of scenes per story | 6 | 4-8 recommended |
| `Aspect_Ratio` | Video aspect ratio | 9:16 | 16:9, 9:16, 1:1 |
| `Text_API_Key` | Text generation API key | - | Your API key |
| `Image_API_Key` | Image generation API key | - | Your API key |
| `TTS_API_Key` | Text-to-Speech API key | - | Your API key |

**Security Note**:
> ⚠️ **API Keys are sensitive!** Only share the spreadsheet with trusted users. Consider using Script Properties for production deployments instead of storing keys in the sheet.

**Optional Configuration** (add these rows if needed):
```
Key                  | Value
---------------------|------------------
Email_Notifications  | your@email.com
Enable_Translations  | true
Default_Language     | en
Drive_Archive_Days   | 30
```

---

## Sheet Setup Checklist

### Initial Setup

- [ ] Create all three sheets with exact names (case-sensitive):
  - [ ] `Story_Ideas`
  - [ ] `Generation_Log`
  - [ ] `Config`

- [ ] Add column headers to each sheet (bold, first row)

- [ ] Add default config values to Config sheet

- [ ] Set up data validation on Story_Ideas:
  - [ ] Approved column: Yes/No dropdown
  - [ ] Status column: Pending/Generated dropdown

- [ ] Apply conditional formatting (optional but recommended)

- [ ] Add at least 5-10 test story ideas to Story_Ideas

- [ ] Set at least one story to `Approved = Yes`

### Formatting (Optional)

**Font**:
- Headers: Bold, size 11
- Data: Regular, size 10

**Colors**:
- Headers: Dark gray background (#434343), white text
- Approved stories: Light green background (#d9ead3)
- Pending stories: Light yellow background (#fff2cc)
- Generated stories: Light gray background (#f3f3f3)

**Column Widths**:
- Story_Ideas:
  - Sl: 50px
  - Idea: 300px
  - Moral: 300px
  - Approved: 100px
  - Status: 100px

- Generation_Log:
  - Date: 100px
  - Story_ID: 250px
  - Language: 100px
  - Status: 100px
  - Drive_Link: 250px
  - Version: 80px

- Config:
  - Key: 200px
  - Value: 400px

---

## Sample Spreadsheet

You can **[make a copy of this template](YOUR_TEMPLATE_LINK)** to get started quickly with all formatting applied.

Or follow the structure above to create your own from scratch.

---

## Integration with Apps Script

The Apps Script reads and writes to these sheets automatically:

**Story_Ideas**:
- ✅ Read by: Story selection, idea listing
- ✏️ Written by: Idea generation, approval actions

**Generation_Log**:
- ✅ Read by: Status display, log retrieval
- ✏️ Written by: Daily generation, regeneration

**Config**:
- ✅ Read by: All scripts for configuration
- ⚠️ Rarely written (typically manual updates only)

---

## Maintenance Tips

### Weekly
- Review generated stories in Generation_Log
- Add approved ideas if running low
- Archive old log entries (move to separate sheet)

### Monthly
- Rotate API keys for security
- Review and approve pending ideas
- Clean up failed generation entries

### As Needed
- Update configuration values
- Generate new story ideas
- Regenerate failed videos

---

## Troubleshooting

**Issue**: "Sheet not found" error
- **Solution**: Verify sheet names match exactly (case-sensitive)

**Issue**: Script can't read/write data
- **Solution**: Check Apps Script has permission to access the spreadsheet

**Issue**: Config values not being used
- **Solution**: Verify exact key names, check for extra spaces

**Issue**: No new ideas showing in dashboard
- **Solution**: Refresh the sheet, check if Story_Ideas sheet has data

---

**Your Google Sheets are now ready!** 📊

Continue with [SETUP.md](SETUP.md) to complete the system setup.
