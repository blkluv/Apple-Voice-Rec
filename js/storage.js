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
        // Save recording
    async saveRecording(recording) {
        try {
            // Initialize DB if not initialized
            if (!this.db) {
                await this.initDB();
            }
            
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // Convert Blob to ArrayBuffer
            const arrayBuffer = await recording.blob.arrayBuffer();
            
            // Create object to save
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
                    
                    // Check storage capacity
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
    
    // Get all recordings
    async getAllRecordings() {
        try {
            // Initialize DB if not initialized
            if (!this.db) {
                await this.initDB();
            }
            
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const recordings = request.result.map(recording => {
                        // Convert ArrayBuffer to Blob
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
                    
                    // Sort by date descending
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
    
    // Get specific recording
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
    
    // Delete recording
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
    
    // Delete all recordings
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
    
    // Download recording file
    async downloadRecording(recording) {
        // Determine file extension
        let extension = 'mp3';
        if (recording.type.includes('mp4') || recording.type.includes('m4a')) {
            extension = 'm4a';
        } else if (recording.type.includes('wav')) {
            extension = 'wav';
        } else if (recording.type.includes('webm')) {
            // WebM not supported on iPhone - try converting to WAV
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
    
    // Export recording files (all recordings)
    async exportAllRecordings() {
        try {
            const recordings = await this.getAllRecordings();
            
            if (recordings.length === 0) {
                alert('No recordings to export.');
                return;
            }
            
            // Create ZIP file (requires JSZip library)
            // Implementing individual downloads for now
            for (const recording of recordings) {
                setTimeout(() => {
                    this.downloadRecording(recording);
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error exporting recordings:', error);
            alert('Failed to export recording files');
        }
    }
    
    // Check storage space
    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const percentUsed = (estimate.usage / estimate.quota * 100).toFixed(2);
                
                console.log(`Storage used: ${this.formatBytes(estimate.usage)} / ${this.formatBytes(estimate.quota)} (${percentUsed}%)`);
                
                // Show warning if storage usage exceeds 90%
                if (percentUsed > 90) {
                    alert('Storage space is running low. Please delete some recordings.');
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
    
    // Format bytes
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Format recording duration
    formatDuration(duration) {
        if (!duration || duration === '00:00:00') return '0 seconds';
        
        const parts = duration.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = parseInt(parts[2]);
        
        let result = '';
        if (hours > 0) result += `${hours} hours `;
        if (minutes > 0) result += `${minutes} minutes `;
        if (seconds > 0) result += `${seconds} seconds`;
        
        return result.trim();
    }
}

// Global storage manager instance
window.storageManager = new StorageManager();