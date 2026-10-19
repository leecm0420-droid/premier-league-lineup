# 프리미어리그 예상 라인업

남은 프리미어리그 경기를 웹에서 고르면 예상 선발 11명, 결장 사유, 홈/무/원정 승률을 보여 줍니다.

GitHub Pages에 정적 사이트로 배포됩니다. 경기 데이터는 **빌드 시점**의 FPL 정보를 사용합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

정적 파일을 만들려면 `npm run build` 후 `out/` 폴더가 생성됩니다.

## 데이터

- 기본: [FPL 공개 API](https://fantasy.premierleague.com/api/) (키 없음)
- 선택: `API_FOOTBALL_KEY`, `OPENAI_API_KEY` (GitHub Actions secrets로 넣으면 배포 빌드에 반영)

`.env.example`을 복사해 `.env.local`을 만들 수 있습니다.
