# HCP Live Performance Deployment Guide

This guide explains how to deploy the Human Client Protocol system for live performances using ngrok tunneling and GitHub Pages.

## Architecture Overview

- **Server**: Runs on your laptop using ngrok tunnel (secure WebSocket connection)
- **Client Interface**: Hosted on GitHub Pages (accessible to audience)
- **QR Code Display**: Hosted on GitHub Pages (shown to audience for joining)
- **Gallery**: Hosted on GitHub Pages (displays performance artwork)

This hybrid approach allows you to maintain full control of the server while making the audience-facing parts accessible from any internet connection.

## Prerequisites

1. **ngrok Account** (free tier works fine)
   - Sign up at https://ngrok.com
   - Install ngrok: `brew install ngrok` (macOS) or download from website
   - Authenticate: `ngrok authtoken YOUR_AUTH_TOKEN`

2. **GitHub Pages Enabled**
   - Repository: https://github.com/mctar/hcp-client
   - Enable GitHub Pages in repository settings (Settings → Pages)
   - Source: Deploy from main branch
   - Your site will be at: https://mctar.github.io/hcp-client/

## Pre-Performance Setup (Do This Before the Show)

### Step 1: Start ngrok Tunnel

On your laptop, start an ngrok tunnel for your HCP server:

```bash
# Start the ngrok tunnel (port 7179 is the HCP server port)
ngrok http 7179
```

You'll see output like this:
```
Session Status                online
Forwarding                    https://abc123xyz.ngrok.io -> http://localhost:7179
```

**Copy the ngrok URL** (e.g., `abc123xyz.ngrok.io`) - you'll need it for the next step.

### Step 2: Update config.js with ngrok URL

Open `/Users/thordur/experiments/mcp/hcp-client/config.js` and update:

```javascript
production: {
  server: 'abc123xyz.ngrok.io',  // ← Replace with YOUR ngrok URL (no https://)
  protocol: 'wss'
},

// Set to 'production' when using ngrok
mode: 'production'  // ← Change from 'development' to 'production'
```

### Step 3: Commit and Push Changes

```bash
cd /Users/thordur/experiments/mcp/hcp-client
git add config.js
git commit -m "Update ngrok URL for live performance"
git push
```

Wait 1-2 minutes for GitHub Pages to rebuild (you can check progress in Settings → Pages).

### Step 4: Start Your HCP Server

On your laptop, start the HCP server:

```bash
cd /Users/thordur/experiments/mcp/hcp/server
./start_system.sh
```

Verify it's running by opening http://localhost:7179/admin

### Step 5: Test the Setup

Before the performance, test that everything works:

1. Open QR code page: https://mctar.github.io/hcp-client/qr.html
2. Scan QR code with your phone
3. Verify you can connect to the server
4. Test receiving an instruction from the admin panel

## During the Performance

### For You (Operator):

1. **Admin Panel**: http://localhost:7179/admin
   - Control the performance
   - Monitor connected participants
   - Send instructions
   - View system metrics

2. **Visualizer**: http://localhost:7179/display/visualizer.html
   - Project this on a screen for the audience
   - Shows the network of participants
   - Displays reflections and system state

### For the Audience:

Display this QR code on a screen or projector:
- **QR Code Page**: https://mctar.github.io/hcp-client/qr.html

Audience members:
1. Scan the QR code with their phone
2. Follow the onboarding process
3. Wait to receive instructions
4. Complete tasks and press "Task Completed"

## Post-Performance

### Save Performance Artwork

If your system generates artwork, you can add it to the gallery:

1. Copy generated images to the `hcp-client` repo
2. Create `artwork-data.json` with performance metadata:

```json
[
  {
    "title": "Performance #1",
    "timestamp": "2025-11-13T19:00:00Z",
    "imageUrl": "performance-1.png",
    "participants": 45,
    "rounds": 12,
    "description": "First live performance at venue XYZ"
  }
]
```

3. Commit and push:
```bash
git add artwork-data.json performance-1.png
git commit -m "Add performance artwork"
git push
```

4. Gallery will be available at: https://mctar.github.io/hcp-client/gallery.html

### Cleanup

1. Stop the HCP server (Ctrl+C)
2. Stop ngrok (Ctrl+C)
3. Optionally reset config.js to development mode:
```javascript
mode: 'development'
```

## Troubleshooting

### "No server address" error on client
- Verify config.js has correct ngrok URL
- Ensure changes are pushed to GitHub
- Wait 1-2 minutes for GitHub Pages to rebuild
- Check GitHub Pages is enabled in repo settings

### "Connection error" when scanning QR code
- Verify ngrok tunnel is running (`ngrok http 7179`)
- Verify HCP server is running (check http://localhost:7179/admin)
- Check ngrok URL in config.js matches tunnel URL
- Ensure `mode: 'production'` in config.js

### QR code shows "Configuration Required" error
- Update config.js with real ngrok URL
- Change `YOUR_NGROK_URL_HERE` to actual URL
- Push changes to GitHub

### Clients connect but don't receive instructions
- Check admin panel shows connected clients
- Try sending a test instruction
- Check browser console for errors (F12)
- Verify WebSocket connection is established (check Network tab)

### GitHub Pages not updating
- Check repository Settings → Pages is enabled
- Verify source is set to "main" branch
- Check Actions tab for build status
- Clear browser cache and hard refresh (Cmd+Shift+R)

## URLs Quick Reference

**Development (Local Testing):**
- Admin: http://localhost:7179/admin
- Visualizer: http://localhost:7179/display/visualizer.html
- Client: http://localhost:7179/displays/client/index.html?server=localhost:7179

**Production (Live Performance):**
- Admin: http://localhost:7179/admin (only accessible on your laptop)
- Visualizer: http://localhost:7179/display/visualizer.html (project this)
- Client: https://mctar.github.io/hcp-client/ (audience scans QR to get here)
- QR Code: https://mctar.github.io/hcp-client/qr.html (display this for audience)
- Gallery: https://mctar.github.io/hcp-client/gallery.html (post-performance)

## Tips for Live Performance

1. **Arrive Early**: Set up and test everything 30+ minutes before showtime
2. **Backup Plan**: Have a local WiFi network as backup if ngrok has issues
3. **Monitor Connection**: Keep admin panel open to see when people join
4. **Phone Wake Lock**: Remind audience to keep their screens on during performance
5. **Test Device**: Keep one test phone connected to catch issues early
6. **Network Quality**: ngrok requires stable internet - consider mobile hotspot backup
7. **Audience Instructions**: Display clear joining instructions before starting

## Security Notes

- ngrok free tier URLs are temporary and change each time
- ngrok URLs are public but randomized (hard to guess)
- Consider ngrok paid plan for custom domains and fixed URLs
- No sensitive data should be transmitted through the system
- Audience clients can only send "task completed" messages (limited attack surface)

## Cost

- **GitHub Pages**: Free
- **ngrok**: Free tier works fine for single performances
- **ngrok Pro** ($8/month): Useful if you want custom domains or run multiple shows

## Next Steps

- Test the full setup before your first performance
- Create a pre-show checklist based on this guide
- Consider rehearsing with a small group first
- Document any venue-specific network requirements

---

**Need Help?** Check the main README or open an issue at https://github.com/mctar/hcp-client/issues
