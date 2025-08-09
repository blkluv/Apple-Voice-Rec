# 🎙️ Voice Recorder PWA

무료 iPhone 음성 녹음 Progressive Web App

## 🚀 주요 기능

- ✅ **무료 사용** - 구독료, 광고 없음
- ✅ **오프라인 작동** - 인터넷 없이도 녹음 가능
- ✅ **홈 화면 설치** - 일반 앱처럼 사용
- ✅ **녹음 관리** - 저장, 재생, 다운로드, 삭제
- ✅ **음질 선택** - 낮음/보통/높음 선택 가능
- ✅ **실시간 시각화** - 오디오 파형 표시

## 📱 설치 방법

### iPhone에서 설치

1. Safari에서 앱 열기
2. 공유 버튼 탭 (하단 중앙)
3. "홈 화면에 추가" 선택
4. 이름 설정 후 "추가" 탭
5. 홈 화면에서 앱 실행

## 🛠️ 로컬 개발 환경 설정

### 1. 아이콘 생성
```bash
# 브라우저에서 create-icons.html 열기
# "모든 아이콘 생성 및 다운로드" 클릭
# 생성된 아이콘을 icons/ 폴더에 저장
```

### 2. 로컬 서버 실행

#### Python 사용
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Node.js 사용
```bash
# http-server 설치
npm install -g http-server

# 서버 실행
http-server -p 8000
```

#### VS Code Live Server 사용
1. VS Code에서 Live Server 확장 설치
2. index.html 우클릭 → "Open with Live Server"

### 3. 테스트
- 브라우저에서 `http://localhost:8000` 접속
- 개발자 도구 (F12) → Application → Service Workers 확인
- 녹음 기능 테스트

## 🌐 배포 방법

### GitHub Pages (무료)

1. GitHub 저장소 생성
2. 코드 업로드
3. Settings → Pages → Source: "Deploy from a branch"
4. Branch: main, Folder: / (root)
5. Save 클릭
6. `https://[username].github.io/[repository-name]` 접속

### Netlify (무료)

1. [Netlify](https://www.netlify.com) 가입
2. "Add new site" → "Import an existing project"
3. GitHub 연결 및 저장소 선택
4. Deploy 클릭
5. 자동 생성된 URL 또는 커스텀 도메인 사용

### Vercel (무료)

1. [Vercel](https://vercel.com) 가입
2. "New Project" 클릭
3. GitHub 저장소 Import
4. Deploy 클릭
5. 자동 생성된 URL 사용

## 📁 프로젝트 구조

```
iphone-voice-record/
├── index.html          # 메인 HTML
├── manifest.json       # PWA 설정
├── service-worker.js   # 오프라인 지원
├── create-icons.html   # 아이콘 생성기
├── css/
│   └── styles.css     # 스타일시트
├── js/
│   ├── app.js         # 메인 앱 로직
│   ├── recorder.js    # 녹음 기능
│   └── storage.js     # 저장소 관리
└── icons/             # 앱 아이콘
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png
    ├── icon-384.png
    └── icon-512.png
```

## ⚠️ 주의사항

- **HTTPS 필요**: PWA는 HTTPS에서만 작동 (localhost 제외)
- **Safari 전용**: iPhone에서는 Safari로만 설치 가능
- **마이크 권한**: 최초 실행 시 마이크 권한 허용 필요
- **저장 공간**: 오프라인 저장은 50MB로 제한

## 🔧 문제 해결

### 녹음이 안 되는 경우
1. 설정 → Safari → 마이크 권한 확인
2. 설정 → 일반 → 재설정 → 위치 및 개인정보 보호 재설정

### Service Worker 오류
1. 개발자 도구 → Application → Clear Storage
2. 페이지 새로고침

### 설치가 안 되는 경우
1. Safari 사용 확인
2. HTTPS 연결 확인
3. manifest.json 경로 확인

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 🤝 기여

Issues와 Pull Requests 환영합니다!

---

Made with ❤️ for free voice recording