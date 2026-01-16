# ShishuKotha (শিশুকথা)

**Automated Moral Story Video Generation System**

A complete system for generating bilingual (Bengali + English) moral story videos daily, powered by AI and Google Workspace.

![Status](https://img.shields.io/badge/status-production-green)
![Platform](https://img.shields.io/badge/platform-Google%20Apps%20Script-blue)
![License](https://img.shields.io/badge/license-MIT-orange)

## 🌟 Features

- **Automated Daily Generation** - Stories generated automatically at 06:00 AM IST
- **Bilingual Support** - Simultaneous Bengali and English video creation
- **AI-Powered** - Uses AI for story generation, images, and voice narration
- **Web Dashboard** - Beautiful interface to manage stories and monitor generation
- **Google Workspace Integration** - Leverages Sheets, Drive, and Apps Script
- **Version Control** - Automatic versioning for regenerated videos
- **Free to Run** - Uses free Google services and AI API tiers

## 📋 System Overview

```
HTML Dashboard (GitHub Pages)
        ↓
Apps Script Web App
        ↓
Google Sheets (Story Management)
        ↓
AI APIs (Text, Image, TTS)
        ↓
Google Drive (Media Storage)
```

## 🚀 Quick Start

### Prerequisites

- Google Account
- GitHub Account
- Free AI API keys:
  - Text generation (Gemini, OpenAI, etc.)
  - Image generation (Stable Diffusion, etc.)
  - Text-to-Speech (Google TTS, etc.)

### Installation

1. **Clone this repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/shishukotha.git
   cd shishukotha
   ```

2. **Follow the setup guide**
   
   See [docs/SETUP.md](docs/SETUP.md) for complete instructions.

3. **Configure and deploy**
   
   See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment steps.

## 📖 Documentation

- **[SETUP.md](docs/SETUP.md)** - Complete setup guide
- **[SHEETS_TEMPLATE.md](docs/SHEETS_TEMPLATE.md)** - Google Sheets structure
- **[API_INTEGRATION.md](docs/API_INTEGRATION.md)** - AI API integration guide
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment

## 📁 Project Structure

```
shishukotha/
├── index.html              # Main dashboard
├── css/
│   └── style.css          # Premium styling
├── js/
│   ├── api.js             # API communication
│   ├── ui.js              # UI rendering
│   └── app.js             # Main app logic
├── apps-script/
│   ├── Code.gs            # Main orchestration
│   ├── WebApp.gs          # HTTP endpoints
│   ├── StoryGenerator.gs  # AI story generation
│   ├── MediaGenerator.gs  # Media generation
│   └── Scheduler.gs       # Daily automation
├── docs/
│   ├── SETUP.md
│   ├── SHEETS_TEMPLATE.md
│   ├── API_INTEGRATION.md
│   └── DEPLOYMENT.md
└── README.md
```

## 🎨 Dashboard Features

- **Real-time Status** - Monitor current generation progress
- **Story Management** - Approve/reject story ideas
- **Download Center** - Access latest videos (BN + EN)
- **Manual Controls** - Trigger generation on demand
- **API Monitoring** - Check connectivity status
- **Generation History** - View all past generations

## 🔄 Daily Workflow

1. **06:00 AM IST** - Daily trigger activates
2. **Story Selection** - Next approved idea chosen
3. **Story Expansion** - AI creates scene-based script
4. **Translation** - Bengali version generated
5. **Media Creation** - Images, audio, subtitles created
6. **Drive Upload** - All assets saved to Drive
7. **Dashboard Update** - Status and links updated

## 🛠️ Technology Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Glassmorphism design
- Mobile-responsive

**Backend:**
- Google Apps Script
- Google Sheets (Database)
- Google Drive (Storage)

**AI Services:**
- Text Generation API (customizable)
- Image Generation API (customizable)
- Text-to-Speech API (customizable)

**Hosting:**
- GitHub Pages (Dashboard)
- Google Apps Script Web App (API)

## ⚙️ Configuration

### Google Sheets: Config Sheet

| Key | Description | Default |
|-----|-------------|---------|
| `Trigger_Time` | Daily generation time | 06:00 |
| `Max_Scenes` | Scenes per story | 6 |
| `Aspect_Ratio` | Video format | 9:16 |
| `Text_API_Key` | Text generation key | - |
| `Image_API_Key` | Image generation key | - |
| `TTS_API_Key` | TTS API key | - |

## 📊 Google Sheets Structure

### Story_Ideas
```
Sl | Idea | Moral | Approved | Status
```

### Generation_Log
```
Date | Story_ID | Language | Status | Drive_Link | Version
```

### Config
```
Key | Value
```

See [SHEETS_TEMPLATE.md](docs/SHEETS_TEMPLATE.md) for details.

## 🔐 Security Notes

- API keys stored in Google Sheets Config (or Script Properties for production)
- Apps Script Web App uses HTTPS
- Dashboard authenticated via Apps Script
- Drive files use link sharing (configurable)

## ⚠️ Important Limitations

**Video Assembly:**
Google Apps Script cannot directly create MP4 videos. The system generates:
- Scene images
- Audio narration
- Subtitles (SRT)
- Assembly instructions (JSON)

You'll need an external tool to combine these:
- FFmpeg (GitHub Actions or local)
- Cloud video API (Shotstack, Creatomate)
- Manual editing software

## 🎯 Roadmap

- [ ] FFmpeg integration via GitHub Actions
- [ ] Multiple aspect ratio support
- [ ] Music background tracks
- [ ] Advanced transition effects
- [ ] Multi-language support (beyond BN/EN)
- [ ] Social media auto-posting
- [ ] Analytics dashboard

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Apps Script platform
- Free AI API providers
- Open source community

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Check the [troubleshooting guide](docs/SETUP.md#troubleshooting)
- Review documentation in `/docs`

## 📸 Screenshots

### Dashboard
*Premium dark theme with glassmorphism effects*

### Story Management
*Approve/reject story ideas with one click*

### Generation Status
*Real-time progress monitoring*

---

**Made with ❤️ for children's education**

**শিশুদের শিক্ষার জন্য ভালোবাসার সাথে তৈরি**
