class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioStream = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.isPaused = false;
        this.isRecording = false;
        this.timerInterval = null;
        
        // Audio context (for visualization)
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.animationId = null;
        
        // Audio quality settings
        this.qualitySettings = {
            low: { audioBitsPerSecond: 32000 },
            medium: { audioBitsPerSecond: 128000 },
            high: { audioBitsPerSecond: 320000 }
        };
        
        this.init();
    }
    
    init() {
        // Check browser compatibility
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('MediaDevices API not supported');
            alert('This browser does not support recording functionality.');
            return;
        }
        
        // Check MediaRecorder support
        if (!window.MediaRecorder) {
            console.error('MediaRecorder not supported');
            alert('This browser does not support MediaRecorder.');
            return;
        }
    }
    
    // Start recording
    async startRecording() {
        try {
            // Request microphone permission
            this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            // Get quality settings
            const quality = document.getElementById('audioQuality').value;
            const options = {
                ...this.qualitySettings[quality],
                mimeType: this.getSupportedMimeType()
            };
            
            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.audioStream, options);
            this.audioChunks = [];
            
            // Data collection event
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            // Recording stop event
            this.mediaRecorder.onstop = () => {
                this.handleRecordingStop();
            };
            
            // Start recording
            this.mediaRecorder.start(1000); // Collect data every 1 second
            this.isRecording = true;
            this.startTime = Date.now();
            
            // Start timer
            this.startTimer();
            
            // Start audio visualization
            this.startVisualization();
            
            // Update UI
            this.updateUI('recording');
            
            console.log('Recording started');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            if (error.name === 'NotAllowedError') {
                alert('Microphone access was denied. Please enable permissions in your settings.');
            } else {
                alert('Could not start recording: ' + error.message);
            }
        }
    }
    
    // Pause recording
    pauseRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            this.isPaused = true;
            this.pausedTime = Date.now();
            this.stopTimer();
            this.updateUI('paused');
            console.log('Recording paused');
        }
    }
    
    // Resume recording
    resumeRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            this.isPaused = false;
            this.startTime += (Date.now() - this.pausedTime);
            this.startTimer();
            this.updateUI('recording');
            console.log('Recording resumed');
        }
    }
    
    // Stop recording
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.isPaused = false;
            
            // Stop stream
            if (this.audioStream) {
                this.audioStream.getTracks().forEach(track => track.stop());
                this.audioStream = null;
            }
            
            // Stop timer
            this.stopTimer();
            
            // Stop visualization
            this.stopVisualization();
            
            // Update UI
            this.updateUI('stopped');
            
            console.log('Recording stopped');
        }
    }
    
    // Handle recording completion
    handleRecordingStop() {
        const audioBlob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder.mimeType || 'audio/webm' 
        });
        
        // Calculate duration
        const duration = this.getRecordingDuration();
        
        // Generate filename (using English format)
        const fileName = this.generateFileName('Recording', 'en');
        
        // Create recording object
        const recording = {
            id: Date.now(),
            name: fileName,
            blob: audioBlob,
            url: URL.createObjectURL(audioBlob),
            size: audioBlob.size,
            type: audioBlob.type,
            duration: duration,
            date: new Date().toISOString(), // For storage
            displayDate: this.formatDisplayDate(new Date()) // For UI
        };
        
        // Save to storage
        window.storageManager.saveRecording(recording);
        
        // Update recordings list
        window.app.displayRecording(recording);
        
        // Reset
        this.audioChunks = [];
        this.startTime = null;
        this.pausedTime = 0;
    }
    
    // Format date for UI display (always English)
    formatDisplayDate(date) {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }
    
    // Start timer
    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 100);
    }
    
    // Stop timer
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    // Update timer display
    updateTimer() {
        if (!this.startTime) return;
        
        const elapsed = Date.now() - this.startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.querySelector('.timer-text').textContent = display;
    }
    
    // Get recording duration
    getRecordingDuration() {
        if (!this.startTime) return '00:00:00';
        
        const elapsed = Date.now() - this.startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    // Generate filename with English format
    generateFileName(prefix = "Recording", format = "en") {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const second = String(now.getSeconds()).padStart(2, '0');
        
        switch(format) {
            case "en": // English format (default)
                return `${prefix}_${year}-${month}-${day}_${hour}-${minute}-${second}`;
                
            case "compact":
                return `${prefix}_${year}${month}${day}_${hour}${minute}${second}`;
                
            case "ampm":
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                return `${prefix}_${year}-${month}-${day}_${hour12}-${minute}-${second}${ampm}`;
                
            default: // ISO-8601 without special chars
                return `${prefix}_${year}${month}${day}T${hour}${minute}${second}Z`;
        }
    }
    
    // Get supported MIME type (prioritizing iOS Safari)
    getSupportedMimeType() {
        const types = [
            'audio/mp4',      // iOS Safari priority
            'audio/mpeg',     // MP3
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log('Using MIME type:', type);
                return type;
            }
        }
        
        return 'audio/mp4'; // iOS fallback
    }
    
    // Start audio visualization
    startVisualization() {
        if (!this.audioStream) return;
        
        // Create Audio Context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        
        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        source.connect(this.analyser);
        
        this.analyser.fftSize = 256;
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
        
        // Canvas setup
        const canvas = document.getElementById('visualizerCanvas');
        const canvasCtx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Start animation
        const draw = () => {
            this.animationId = requestAnimationFrame(draw);
            
            this.analyser.getByteFrequencyData(this.dataArray);
            
            canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = (this.dataArray[i] / 255) * canvas.height;
                
                canvasCtx.fillStyle = `rgb(74, 144, 226)`;
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }
    
    // Stop audio visualization
    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        // Clear canvas
        const canvas = document.getElementById('visualizerCanvas');
        const canvasCtx = canvas.getContext('2d');
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Update UI state
    updateUI(state) {
        const recordBtn = document.getElementById('recordBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = statusIndicator.querySelector('.status-text');
        const statusDot = statusIndicator.querySelector('.status-dot');
        
        switch (state) {
            case 'recording':
                recordBtn.disabled = true;
                pauseBtn.disabled = false;
                stopBtn.disabled = false;
                statusText.textContent = 'Live';
                statusDot.className = 'status-dot recording';
                break;
                
            case 'paused':
                recordBtn.disabled = true;
                pauseBtn.disabled = false;
                pauseBtn.innerHTML = `
                    <svg class="icon-play" viewBox="0 0 24 24" width="24" height="24">
                        <path d="M8 5v14l11-7z" fill="currentColor"/>
                    </svg>
                    <span>Resume</span>
                `;
                stopBtn.disabled = false;
                statusText.textContent = 'Paused';
                statusDot.className = 'status-dot paused';
                break;
                
            case 'stopped':
            default:
                recordBtn.disabled = false;
                pauseBtn.disabled = true;
                pauseBtn.innerHTML = `
                    <svg class="icon-pause" viewBox="0 0 24 24" width="24" height="24">
                        <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                        <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
                    </svg>
                    <span>Pause</span>
                `;
                stopBtn.disabled = true;
                statusText.textContent = 'Ready';
                statusDot.className = 'status-dot';
                document.querySelector('.timer-text').textContent = '00:00:00';
                break;
        }
    }
}

// Global recorder instance
window.recorder = new VoiceRecorder();