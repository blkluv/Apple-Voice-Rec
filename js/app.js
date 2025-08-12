class VoiceRecorderApp {
    constructor() {
        this.currentPlayingId = null;
        this.init();
    }
    
    async init() {
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 저장된 녹음 목록 로드
        await this.loadRecordings();
        
        // URL 파라미터 체크 (단축키로 실행된 경우)
        this.checkUrlParams();
    }
    
    setupEventListeners() {
        // 녹음 버튼
        document.getElementById('recordBtn').addEventListener('click', () => {
            window.recorder.startRecording();
        });
        
        // 일시정지/재개 버튼
        document.getElementById('pauseBtn').addEventListener('click', () => {
            if (window.recorder.isPaused) {
                window.recorder.resumeRecording();
            } else {
                window.recorder.pauseRecording();
            }
        });
        
        // 정지 버튼
        document.getElementById('stopBtn').addEventListener('click', () => {
            window.recorder.stopRecording();
        });
        
        // 페이지 벗어날 때 경고
        window.addEventListener('beforeunload', (e) => {
            if (window.recorder && window.recorder.isRecording) {
                e.preventDefault();
                e.returnValue = '녹음이 진행 중입니다. 페이지를 벗어나시겠습니까?';
            }
        });
        
        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            console.log('온라인 상태');
            this.updateConnectionStatus(true);
        });
        
        window.addEventListener('offline', () => {
            console.log('오프라인 상태');
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
        
        // 빈 메시지 제거
        const emptyMessage = recordingsList.querySelector('.empty-message');
        if (emptyMessage) {
            emptyMessage.remove();
        }
        
        // 녹음 아이템 생성
        const recordingItem = document.createElement('div');
        recordingItem.className = 'recording-item';
        recordingItem.dataset.id = recording.id;
        
        // 날짜 포맷팅
        const date = new Date(recording.date);
        const dateStr = date.toLocaleDateString('ko-KR');
        const timeStr = date.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // 파일 크기 포맷팅
        const sizeStr = window.storageManager.formatBytes(recording.size);
        
        // 녹음 시간 포맷팅
        const durationStr = window.storageManager.formatDuration(recording.duration);
        
        recordingItem.innerHTML = `
            <div class="recording-info">
                <div class="recording-name">${recording.name}</div>
                <div class="recording-meta">
                    ${dateStr} ${timeStr} · ${durationStr} · ${sizeStr}
                </div>
            </div>
            <div class="recording-actions">
                <button class="btn-action btn-play" data-id="${recording.id}" aria-label="재생">
                    ▶️
                </button>
                <button class="btn-action btn-download" data-id="${recording.id}" aria-label="다운로드">
                    ⬇️
                </button>
                <button class="btn-action btn-delete" data-id="${recording.id}" aria-label="삭제">
                    🗑️
                </button>
            </div>
        `;
        
        // 이벤트 리스너 추가
        const playBtn = recordingItem.querySelector('.btn-play');
        const downloadBtn = recordingItem.querySelector('.btn-download');
        const deleteBtn = recordingItem.querySelector('.btn-delete');
        
        playBtn.addEventListener('click', () => this.playRecording(recording));
        downloadBtn.addEventListener('click', () => this.downloadRecording(recording));
        deleteBtn.addEventListener('click', () => this.deleteRecording(recording.id));
        
        // 목록에 추가 (최신 녹음이 위로)
        recordingsList.insertBefore(recordingItem, recordingsList.firstChild);
    }
    
    async playRecording(recording) {
        try {
            const audioPlayer = document.getElementById('audioPlayer');
            
            // 이미 재생 중인 경우
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
            
            // 새로운 녹음 재생
            audioPlayer.src = recording.url;
            audioPlayer.style.display = 'block';
            
            // 이전 재생 버튼 초기화
            if (this.currentPlayingId) {
                this.updatePlayButton(this.currentPlayingId, false);
            }
            
            this.currentPlayingId = recording.id;
            
            // 재생 시작
            await audioPlayer.play();
            this.updatePlayButton(recording.id, true);
            
            // 재생 종료 이벤트
            audioPlayer.onended = () => {
                this.updatePlayButton(recording.id, false);
                this.currentPlayingId = null;
                audioPlayer.style.display = 'none';
            };
            
        } catch (error) {
            console.error('Error playing recording:', error);
            alert('재생 중 오류가 발생했습니다.');
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
        if (!confirm('이 녹음을 삭제하시겠습니까?')) {
            return;
        }
        
        try {
            // 재생 중인 경우 정지
            if (this.currentPlayingId === recordingId) {
                const audioPlayer = document.getElementById('audioPlayer');
                audioPlayer.pause();
                audioPlayer.style.display = 'none';
                this.currentPlayingId = null;
            }
            
            // 저장소에서 삭제
            await window.storageManager.deleteRecording(recordingId);
            
            // UI에서 제거
            const recordingItem = document.querySelector(`[data-id="${recordingId}"]`);
            if (recordingItem) {
                recordingItem.remove();
            }
            
            // 목록이 비었는지 확인
            const recordingsList = document.getElementById('recordingsList');
            if (recordingsList.children.length === 0) {
                recordingsList.innerHTML = '<p class="empty-message">No Recordings.</p>';
            }
            
        } catch (error) {
            console.error('Error deleting recording:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    }
    
    updateConnectionStatus(isOnline) {
        const statusText = document.querySelector('.status-text');
        if (statusText && !window.recorder.isRecording) {
            statusText.textContent = isOnline ? '준비' : '오프라인';
        }
    }
    
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        // 단축키로 녹음 시작
        if (action === 'record') {
            setTimeout(() => {
                window.recorder.startRecording();
            }, 500);
        }
    }
    
    // 저장 공간 정보 표시
    async showStorageInfo() {
        const info = await window.storageManager.checkStorageQuota();
        if (info) {
            console.log(`저장 공간: ${info.percentUsed}% 사용 중`);
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VoiceRecorderApp();
});

// iOS 특별 처리
if (navigator.standalone) {
    // 홈 화면에서 실행된 경우
    console.log('Running as standalone app');
}

// 오디오 컨텍스트 초기화 (iOS 제한 우회)
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