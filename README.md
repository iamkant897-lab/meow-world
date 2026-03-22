# 🐱 냥월드 — 전세계 고양이 실시간 갤러리

아내를 위한 전세계 귀여운 고양이 사진 실시간 집합소 ❤️

## 🚀 실행 방법

### 윈도우 (가장 쉬운 방법)
```
start.bat 더블클릭
```
자동으로 백엔드 + 프론트엔드를 설치하고 브라우저를 열어줍니다!

### 수동 실행
```bash
# 터미널 1 — 백엔드
cd backend
npm install
node server.js

# 터미널 2 — 프론트엔드
cd frontend
npm install
npm run dev
```
브라우저 → http://localhost:5173

## ✨ 기능

| 기능 | 설명 |
|------|------|
| 🐾 **TheCatAPI** | 수만 장의 고양이 전용 사진 & 품종 정보 |
| 📸 **Unsplash** | 고화질 감성 고양이 사진 |
| 🤖 **Reddit** | r/cats, r/aww 등 실시간 인기 고양이 게시물 |
| 🔄 **실시간 업데이트** | 60초마다 자동으로 새 사진 확인 |
| ❤️ **좋아요** | 마음에 드는 사진 저장 (로컬 저장) |
| 🎲 **랜덤 냥이** | 버튼 클릭 → 랜덤 고양이 즉시 등장 |
| 🔍 **필터** | 소스별 / 좋아요만 필터링 |
| 📱 **반응형** | 모바일/태블릿/데스크탑 모두 지원 |
| ♾️ **무한 스크롤** | 스크롤하면 계속 새 사진 로딩 |

## 🏗 기술 스택

```
Backend:   Node.js + Express + node-cache
Frontend:  React 18 + Vite
APIs:      The Cat API, Unsplash, Reddit
```

## 📁 폴더 구조

```
meow-world/
├── backend/
│   ├── package.json
│   └── server.js          ← Express API 서버 (포트 3001)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/    ← Header, Gallery, Modal, 등
│   │   └── hooks/         ← usePhotos, useLikes
│   └── vite.config.js
├── start.bat              ← 원클릭 실행 (윈도우)
└── index.html             ← 심플 데모 버전
```
