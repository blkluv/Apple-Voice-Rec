class VoiceRecorderApp {
    constructor() {
        this.currentPlayingId = null;
        this.init();
    }
    
    async init() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Load saved recordings list
        await this.loadRecordings();
        
        // Check URL parameters (if launched via shortcut)
        this.checkUrlParams();
    }
    
    setupEventListeners() {
        // Record button
        document.getElementById('recordBtn').addEventListener('click', () => {
            window.recorder.startRecording();
        });
        
        // Pause/Resume button
        document.getElementById('pauseBtn').addEventListener('click', () => {
            if (window.recorder.isPaused) {
                window.recorder.resumeRecording();
            } else {
                window.recorder.pauseRecording();
            }
        });
        
        // Stop button
        document.getElementById('stopBtn').addEventListener('click', () => {
            window.recorder.stopRecording();
        });
        
        // Page leave warning
        window.addEventListener('beforeunload', (e) => {
            if (window.recorder && window.recorder.isRecording) {
                e.preventDefault();
                e.returnValue = 'Recording is in progress. Are you sure you want to leave?';
            }
        });
        
        // Online/Offline status detection
        window.addEventListener('online', () => {
            console.log('Online status');
            this.updateConnectionStatus(true);
        });
        
        window.addEventListener('offline', () => {
            console.log('Offline status');
            this.updateConnectionStatus(false);
        });
    }
    
    async loadRecordings() {
        try {
            const recordings = await window.storageManager.getAllRecordings();
            
            const recordingsList = document.getElementById('recordingsList');
            
            if (recordings.length === 0) {
                recordingsList.innerHTML = '<p class="empty-message">No recordings.</p>';
                return;
            }
            
            recordingsList.innerHTML = '';
            
            recordings.forEach(recording => {
                this.displayRecording(recording);
            });
            
        } catch (error) {
            console.error('Error loading recordings:', error);
        }
    }
    
    displayRecording(recording) {
        const recordingsList = document.getElementById('recordingsList');
        
        // Remove empty message
        const emptyMessage = recordingsList.querySelector('.empty-message');
        if (emptyMessage) {
            emptyMessage.remove();
        }
        
        // Create recording item
        const recordingItem = document.createElement('div');
        recordingItem.className = 'recording-item';
        recordingItem.dataset.id = recording.id;
        
        // Date formatting
        const date = new Date(recording.date);
        const dateStr = date.toLocaleDateString('en-US');
        const timeStr = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // File size formatting
        const sizeStr = window.storageManager.formatBytes(recording.size);
        
        // Recording duration formatting
        const durationStr = window.storageManager.formatDuration(recording.duration);
        
        recordingItem.innerHTML = `
            <div class="recording-info">
                <div class="recording-name">${recording.name}</div>
                <div class="recording-meta">
                    ${dateStr} ${timeStr} · ${durationStr} · ${sizeStr}
                </div>
            </div>
            <div class="recording-actions">
                <button class="btn-action btn-play" data-id="${recording.id}" aria-label="Play">
                    ▶️
                </button>
                <button class="btn-action btn-download" data-id="${recording.id}" aria-label="Download">
                    ⬇️
                </button>
                <button class="btn-action btn-delete" data-id="${recording.id}" aria-label="Delete">
                    🗑️
                </button>
            </div>
        `;
        
        // Add event listeners
        const playBtn = recordingItem.querySelector('.btn-play');
        const downloadBtn = recordingItem.querySelector('.btn-download');
        const deleteBtn = recordingItem.querySelector('.btn-delete');
        
        playBtn.addEventListener('click', () => this.playRecording(recording));
        downloadBtn.addEventListener('click', () => this.downloadRecording(recording));
        deleteBtn.addEventListener('click', () => this.deleteRecording(recording.id));
        
        // Add to list (newest recordings first)
        recordingsList.insertBefore(recordingItem, recordingsList.firstChild);
    }
    
    async playRecording(recording) {
        try {
            const audioPlayer = document.getElementById('audioPlayer');
            
            // If already playing
            if (this.currentPlayingId === recording.id) {
                if (audioPlayer.paused) {
                    audioPlayer.play();
                    this.updatePlayButton(recording.id, true);
                } else {
                    audioPlayer.pause();
                    this.updatePlayButton(recording.id, false);
                }
                return;
            }
            
            // Play new recording
            audioPlayer.src = recording.url;
            audioPlayer.style.display = 'block';
            
            // Reset previous play button
            if (this.currentPlayingId) {
                this.updatePlayButton(this.currentPlayingId, false);
            }
            
            this.currentPlayingId = recording.id;
            
            // Start playback
            await audioPlayer.play();
            this.updatePlayButton(recording.id, true);
            
            // Playback end event
            audioPlayer.onended = () => {
                this.updatePlayButton(recording.id, false);
                this.currentPlayingId = null;
                audioPlayer.style.display = 'none';
            };
            
        } catch (error) {
            console.error('Error playing recording:', error);
            alert('An error occurred while playing.');
        }
    }
    
    updatePlayButton(recordingId, isPlaying) {
        const recordingItem = document.querySelector(`[data-id="${recordingId}"]`);
        if (recordingItem) {
            const playBtn = recordingItem.querySelector('.btn-play');
            playBtn.textContent = isPlaying ? '⏸️' : '▶️';
        }
    }
    
    downloadRecording(recording) {
        window.storageManager.downloadRecording(recording);
    }
    
    async deleteRecording(recordingId) {
        if (!confirm('Are you sure you want to delete this recording?')) {
            return;
        }
        
        try {
            // Stop if currently playing
            if (this.currentPlayingId === recordingId) {
                const audioPlayer = document.getElementById('audioPlayer');
                audioPlayer.pause();
                audioPlayer.style.display = 'none';
                this.currentPlayingId = null;
            }
            
            // Delete from storage
            await window.storageManager.deleteRecording(recordingId);
            
            // Remove from UI
            const recordingItem = document.querySelector(`[data-id="${recordingId}"]`);
            if (recordingItem) {
                recordingItem.remove();
            }
            
            // Check if list is empty
            const recordingsList = document.getElementById('recordingsList');
            if (recordingsList.children.length === 0) {
                recordingsList.innerHTML = '<p class="empty-message">No Recordings.</p>';
            }
            
        } catch (error) {
            console.error('Error deleting recording:', error);
            alert('An error occurred while deleting.');
        }
    }
    
    updateConnectionStatus(isOnline) {
        const statusText = document.querySelector('.status-text');
        if (statusText && !window.recorder.isRecording) {
            statusText.textContent = isOnline ? 'Ready' : 'Offline';
        }
    }
    
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        // Start recording via shortcut
        if (action === 'record') {
            setTimeout(() => {
                window.recorder.startRecording();
            }, 500);
        }
    }
    
    // Display storage information
    async showStorageInfo() {
        const info = await window.storageManager.checkStorageQuota();
        if (info) {
            console.log(`Storage: ${info.percentUsed}% used`);
        }
    }
}

// App initialization
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VoiceRecorderApp();
});

// iOS special handling
if (navigator.standalone) {
    // Running from home screen
    console.log('Running as standalone app');
}

// Audio context initialization (iOS restriction workaround)
document.addEventListener('touchstart', function() {
    if (window.recorder && window.recorder.audioContext) {
        window.recorder.audioContext.resume();
    }
}, { once: true });

// Show/hide mint button based on recordings
function updateMintButtonVisibility() {
    const mintBtn = document.getElementById('mintRecordingBtn');
    const recordingsExist = document.querySelectorAll('.recording-item').length > 0;
    mintBtn.style.display = recordingsExist ? 'block' : 'none';
}

// Call this after loading/adding/deleting recordings
updateMintButtonVisibility();

// Optional: Connect to Web3
document.getElementById('mintRecordingBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    alert('Minting functionality will go here!');
    // Replace with actual minting logic
});