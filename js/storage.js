class StorageManager {
    constructor() {
        this.dbName = 'VoiceRecorderDB';
        this.dbVersion = 1;
        this.storeName = 'recordings';
        this.db = null;
        
        this.initDB();
    }
    
    // IndexedDB 초기화
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                
                // 객체 저장소 생성
                if (!this.db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = this.db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: false
                    });
                    
                    // 인덱스 생성
                    objectStore.createIndex('date', 'date', { unique: false });
                    objectStore.createIndex('name', 'name', { unique: false });
                    
                    console.log('Object store created');
                }
            };
        });
    }
    
    // 녹음 저장
    async saveRecording(recording) {
        try {
            // DB가 초기화되지 않았다면 초기화
            if (!this.db) {
                await this.initDB();
            }
            
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // Blob을 ArrayBuffer로 변환
            const arrayBuffer = await recording.blob.arrayBuffer();
            
            // 저장할 객체 생성
            const recordingData = {
                id: recording.id,
                name: recording.name,
                data: arrayBuffer,
                size: recording.size,
                type: recording.type,
                duration: recording.duration,
                date: recording.date
            };
            
            const request = store.add(recordingData);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    console.log('Recording saved successfully');
                    
                    // 저장 용량 체크
                    this.checkStorageQuota();
                    
                    resolve(recording.id);
                };
                
                request.onerror = () => {
                    console.error('Failed to save recording');
                    reject(request.error);
                };
            });
            
        } catch (error) {
            console.error('Error saving recording:', error);
            throw error;
        }
    }
    
    // 모든 녹음 가져오기
    async getAllRecordings() {
        try {
            // DB가 초기화되지 않았다면 초기화
            if (!this.db) {
                await this.initDB();
            }
            
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const recordings = request.result.map(recording => {
                        // ArrayBuffer를 Blob으로 변환
                        const blob = new Blob([recording.data], { type: recording.type });
                        const url = URL.createObjectURL(blob);
                        
                        return {
                            id: recording.id,
                            name: recording.name,
                            blob: blob,
                            url: url,
                            size: recording.size,
                            type: recording.type,
                            duration: recording.duration,
                            date: recording.date
                        };
                    });
                    
                    // 날짜 기준 내림차순 정렬
                    recordings.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    resolve(recordings);
                };
                
                request.onerror = () => {
                    console.error('Failed to get recordings');
                    reject(request.error);
                };
            });
            
        } catch (error) {
            console.error('Error getting recordings:', error);
            return [];
        }
    }
    
    // 특정 녹음 가져오기
    async getRecording(id) {
        try {
            if (!this.db) {
                await this.initDB();
            }
            
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const recording = request.result;
                    if (recording) {
                        const blob = new Blob([recording.data], { type: recording.type });
                        const url = URL.createObjectURL(blob);
                        
                        resolve({
                            id: recording.id,
                            name: recording.name,
                            blob: blob,
                            url: url,
                            size: recording.size,
                            type: recording.type,
                            duration: recording.duration,
                            date: recording.date
                        });
                    } else {
                        resolve(null);
                    }
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
            
        } catch (error) {
            console.error('Error getting recording:', error);
            return null;
        }
    }
    
    // 녹음 삭제
    async deleteRecording(id) {
        try {
            if (!this.db) {
                await this.initDB();
            }
            
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    console.log('Recording deleted successfully');
                    resolve(true);
                };
                
                request.onerror = () => {
                    console.error('Failed to delete recording');
                    reject(request.error);
                };
            });
            
        } catch (error) {
            console.error('Error deleting recording:', error);
            return false;
        }
    }
    
    // 모든 녹음 삭제
    async deleteAllRecordings() {
        try {
            if (!this.db) {
                await this.initDB();
            }
            
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    console.log('All recordings deleted');
                    resolve(true);
                };
                
                request.onerror = () => {
                    console.error('Failed to delete all recordings');
                    reject(request.error);
                };
            });
            
        } catch (error) {
            console.error('Error deleting all recordings:', error);
            return false;
        }
    }
    
    // 녹음 파일 다운로드
    async downloadRecording(recording) {
        // 파일 확장자 결정
        let extension = 'mp3';
        if (recording.type.includes('mp4') || recording.type.includes('m4a')) {
            extension = 'm4a';
        } else if (recording.type.includes('wav')) {
            extension = 'wav';
        } else if (recording.type.includes('webm')) {
            // WebM은 iPhone에서 지원 안함 - WAV로 변환 시도
            extension = 'wav';
            console.warn('WebM format detected - iPhone may not support playback');
        }
        
        const a = document.createElement('a');
        a.href = recording.url;
        a.download = `${recording.name}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    // 녹음 파일 내보내기 (모든 녹음)
    async exportAllRecordings() {
        try {
            const recordings = await this.getAllRecordings();
            
            if (recordings.length === 0) {
                alert('내보낼 녹음이 없습니다.');
                return;
            }
            
            // ZIP 파일로 묶기 (JSZip 라이브러리 필요)
            // 여기서는 개별 다운로드로 구현
            for (const recording of recordings) {
                setTimeout(() => {
                    this.downloadRecording(recording);
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error exporting recordings:', error);
            alert('녹음 파일 내보내기 실패');
        }
    }
    
    // 저장 공간 확인
    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const percentUsed = (estimate.usage / estimate.quota * 100).toFixed(2);
                
                console.log(`Storage used: ${this.formatBytes(estimate.usage)} / ${this.formatBytes(estimate.quota)} (${percentUsed}%)`);
                
                // 저장 공간이 90% 이상 사용되면 경고
                if (percentUsed > 90) {
                    alert('저장 공간이 부족합니다. 일부 녹음을 삭제해주세요.');
                }
                
                return {
                    usage: estimate.usage,
                    quota: estimate.quota,
                    percentUsed: percentUsed
                };
                
            } catch (error) {
                console.error('Error checking storage quota:', error);
            }
        }
    }
    
    // 바이트 포맷팅
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 녹음 시간 포맷팅
    formatDuration(duration) {
        if (!duration || duration === '00:00:00') return '0초';
        
        const parts = duration.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = parseInt(parts[2]);
        
        let result = '';
        if (hours > 0) result += `${hours}시간 `;
        if (minutes > 0) result += `${minutes}분 `;
        if (seconds > 0) result += `${seconds}초`;
        
        return result.trim();
    }
}

// 전역 storage manager 인스턴스
window.storageManager = new StorageManager();