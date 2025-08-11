🎙️ Voice Recorder PWA

Free iPhone Voice Recording Progressive Web App

🚀 Key Features
	•	✅ Free to use — No subscriptions, no ads
	•	✅ Works offline — Record without an internet connection
	•	✅ Installable on Home Screen — Use like a native app
	•	✅ Manage Recordings — Save, play, download, delete
	•	✅ Audio Quality Options — Choose low, medium, or high
	•	✅ Real-time Visualization — See audio waveforms as you record

📱 How to Install

On iPhone
	1.	Open the app in Safari
	2.	Tap the Share button (bottom center)
	3.	Select “Add to Home Screen”
	4.	Name the app and tap “Add”
	5.	Launch the app from your Home Screen

🛠️ Local Development Setup

# Open create-icons.html in your browser  
# Click “Generate and Download All Icons”  
# Save the icons into the icons/ folder  

1. Generate Icons
# Open create-icons.html in your browser  
# Click “Generate and Download All Icons”  
# Save the icons into the icons/ folder  

2. Run Local Server
# For Python 3  
python -m http.server 8000

# For Python 2  
python -m SimpleHTTPServer 8000

Using Node.js
# Install http-server  
npm install -g http-server

# Run server  
http-server -p 8000

Using VS Code Live Server
	1.	Install the Live Server extension in VS Code
	2.	Right-click index.html → “Open with Live Server”

3. Testing
	•	Open http://localhost:8000 in your browser
	•	Open Developer Tools (F12) → Application → Service Workers to verify
	•	Test recording functionality

🌐 Deployment Options

GitHub Pages (Free)
	1.	Create a GitHub repository
	2.	Upload your code
	3.	Go to Settings → Pages → Source: Select “Deploy from a branch”
	4.	Choose Branch: main, Folder: / (root)
	5.	Click Save
	6.	Access via https://[username].github.io/[repository-name]

Netlify (Free)
	1.	Sign up at Netlify
	2.	Click “Add new site” → “Import an existing project”
	3.	Connect GitHub and select your repo
	4.	Click Deploy
	5.	Use the auto-generated URL or set up a custom domain

Vercel (Free)
	1.	Sign up at Vercel
	2.	Click “New Project”
	3.	Import your GitHub repository
	4.	Click Deploy
	5.	Use the provided URL

📁 Project Structure
iphone-voice-record/
├── index.html          # Main HTML file
├── manifest.json       # PWA configuration
├── service-worker.js   # Offline support
├── create-icons.html   # Icon generator
├── css/
│   └── styles.css      # Stylesheet
├── js/
│   ├── app.js          # Main app logic
│   ├── recorder.js     # Recording functions
│   └── storage.js      # Storage management
└── icons/              # App icons
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png
    ├── icon-384.png
    └── icon-512.png

⚠️ Important Notes
	•	Requires HTTPS: PWAs only work over HTTPS (localhost excluded)
	•	Safari Only: On iPhone, installation is only supported via Safari
	•	Microphone Permission: Must allow microphone access on first use
	•	Storage Limit: Offline storage capped at 50MB

🔧 Troubleshooting

If Recording Doesn’t Work
	1.	Check microphone permissions in Settings → Safari
	2.	Reset location & privacy settings: Settings → General → Reset → Reset Location & Privacy

Service Worker Errors
	1.	In Developer Tools → Application → Clear Storage
	2.	Refresh the page

If Installation Fails
	1.	Confirm you are using Safari
	2.	Verify HTTPS connection
	3.	Check manifest.json path correctness

📄 License

MIT License — Free to use, modify, and distribute

🤝 Contributing

Issues and pull requests are welcome!

⸻

Made with ❤️ by Wizard of Hahz for free voice recording

