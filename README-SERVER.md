# 🚀 Quick Start Guide - Local Server

## How to Run the Dashboard

### Easy Way (Recommended)
1. **Double-click** `start-server.bat` in the `lodge` folder
2. Your browser will automatically open to `http://localhost:8000/index.html`
3. The terminal window will show the server is running
4. **Keep the terminal window open** while using the dashboard

### Stopping the Server
- Press `Ctrl + C` in the terminal window
- OR just close the terminal window

---

## Troubleshooting

### ❌ "Python was not found"
**Fix:** Install Python from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

### ❌ "Address already in use"
**Fix:** Port 8000 is already being used by another program
- Open `start-server.bat` in a text editor
- Change `8000` to `8080` or `3000`
- Save and try again

### ❌ Browser doesn't open automatically
**Fix:** Manually open your browser and go to:
```
http://localhost:8000/index.html
```

---

## Why Do I Need This?

The dashboard makes **POST requests** (for buttons like "Generate Ideas", "Approve", "Reject") which are blocked by CORS when opening `index.html` directly from your file system.

Running a local server solves this issue and makes all features work properly! ✅
