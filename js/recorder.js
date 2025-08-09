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
        
        // 오디오 컨텍스트 (시각화용)
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.animationId = null;
        
        // 음질 설정
        this.qualitySettings = {
            low: { audioBitsPerSecond: 32000 },
            medium: { audioBitsPerSecond: 128000 },
            high: { audioBitsPerSecond: 320000 }
        };
        
        this.init();
    }
    
    init() {
        // 브라우저 호환성 체크
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('MediaDevices API not supported');
            alert('이 브라우저는 녹음 기능을 지원하지 않습니다.');
            return;
        }
        
        // MediaRecorder 지원 체크
        if (!window.MediaRecorder) {
            console.error('MediaRecorder not supported');
            alert('이 브라우저는 MediaRecorder를 지원하지 않습니다.');
            return;
        }
    }
    
    // 녹음 시작
    async startRecording() {
        try {
            // 마이크 권한 요청
            this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            // 음질 설정 가져오기
            const quality = document.getElementById('audioQuality').value;
            const options = {
                ...this.qualitySettings[quality],
                mimeType: this.getSupportedMimeType()
            };
            
            // MediaRecorder 생성
            this.mediaRecorder = new MediaRecorder(this.audioStream, options);
            this.audioChunks = [];
            
            // 데이터 수집 이벤트
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            // 녹음 중지 이벤트
            this.mediaRecorder.onstop = () => {
                this.handleRecordingStop();
            };
            
            // 녹음 시작
            this.mediaRecorder.start(1000); // 1초마다 데이터 수집
            this.isRecording = true;
            this.startTime = Date.now();
            
            // 타이머 시작
            this.startTimer();
            
            // 오디오 시각화 시작
            this.startVisualization();
            
            // UI 업데이트
            this.updateUI('recording');
            
            console.log('Recording started');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            if (error.name === 'NotAllowedError') {
                alert('마이크 접근 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.');
            } else {
                alert('녹음을 시작할 수 없습니다: ' + error.message);
            }
        }
    }
    
    // 녹음 일시정지
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
    
    // 녹음 재개
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
    
    // 녹음 중지
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.isPaused = false;
            
            // 스트림 정지
            if (this.audioStream) {
                this.audioStream.getTracks().forEach(track => track.stop());
                this.audioStream = null;
            }
            
            // 타이머 정지
            this.stopTimer();
            
            // 시각화 정지
            this.stopVisualization();
            
            // UI 업데이트
            this.updateUI('stopped');
            
            console.log('Recording stopped');
        }
    }
    
    // 녹음 완료 처리
    handleRecordingStop() {
        const audioBlob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder.mimeType || 'audio/webm' 
        });
        
        // 녹음 시간 계산
        const duration = this.getRecordingDuration();
        
        // 파일명 생성
        const fileName = this.generateFileName();
        
        // 녹음 객체 생성
        const recording = {
            id: Date.now(),
            name: fileName,
            blob: audioBlob,
            url: URL.createObjectURL(audioBlob),
            size: audioBlob.size,
            type: audioBlob.type,
            duration: duration,
            date: new Date().toISOString()
        };
        
        // 저장소에 저장
        window.storageManager.saveRecording(recording);
        
        // 녹음 목록 업데이트
        window.app.displayRecording(recording);
        
        // 초기화
        this.audioChunks = [];
        this.startTime = null;
        this.pausedTime = 0;
    }
    
    // 타이머 시작
    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 100);
    }
    
    // 타이머 정지
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    // 타이머 업데이트
    updateTimer() {
        if (!this.startTime) return;
        
        const elapsed = Date.now() - this.startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.querySelector('.timer-text').textContent = display;
    }
    
    // 녹음 시간 가져오기
    getRecordingDuration() {
        if (!this.startTime) return '00:00:00';
        
        const elapsed = Date.now() - this.startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    // 파일명 생성
    generateFileName() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const second = String(now.getSeconds()).padStart(2, '0');
        
        return `녹음_${year}${month}${day}_${hour}${minute}${second}`;
    }
    
    // 지원되는 MIME 타입 확인 (iOS Safari 우선)
    getSupportedMimeType() {
        const types = [
            'audio/mp4',      // iOS Safari 우선
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
        
        return 'audio/mp4'; // iOS 기본값
    }
    
    // 오디오 시각화 시작
    startVisualization() {
        if (!this.audioStream) return;
        
        // Audio Context 생성
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        
        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        source.connect(this.analyser);
        
        this.analyser.fftSize = 256;
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
        
        // Canvas 설정
        const canvas = document.getElementById('visualizerCanvas');
        const canvasCtx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // 애니메이션 시작
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
    
    // 오디오 시각화 정지
    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        // Canvas 초기화
        const canvas = document.getElementById('visualizerCanvas');
        const canvasCtx = canvas.getContext('2d');
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // UI 업데이트
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
                statusText.textContent = '녹음 중';
                statusDot.className = 'status-dot recording';
                break;
            case 'paused':
                recordBtn.disabled = true;
                pauseBtn.disabled = false;
                pauseBtn.innerHTML = `
                    <svg class="icon-play" viewBox="0 0 24 24" width="24" height="24">
                        <path d="M8 5v14l11-7z" fill="currentColor"/>
                    </svg>
                    <span>재개</span>
                `;
                stopBtn.disabled = false;
                statusText.textContent = '일시정지';
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
                    <span>일시정지</span>
                `;
                stopBtn.disabled = true;
                statusText.textContent = '준비';
                statusDot.className = 'status-dot';
                document.querySelector('.timer-text').textContent = '00:00:00';
                break;
        }
    }
}

// 전역 recorder 인스턴스
window.recorder = new VoiceRecorder();