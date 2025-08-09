# AGENTS Instructions

- 이 저장소는 Next.js 15(App Router)와 TypeScript를 사용합니다.
- `app` 디렉터리 컴포넌트는 기본적으로 서버 컴포넌트입니다. 클라이언트 기능을 쓰려면 파일 상단에 `'use client'`를 선언하세요.
- 내부 모듈은 `@/` 경로 별칭으로 import합니다. 상대 경로를 혼용하지 마세요.
- Tailwind CSS v4가 PostCSS 플러그인으로 설정되어 있으며 `tailwind.config` 파일이 없습니다.
- OpenAI API를 사용하므로 실행 시 `OPENAI_API_KEY` 환경 변수가 필요합니다.
- 테스트 스크립트가 없으므로 `npm test`는 실패하지만, 모든 변경 후 `npm run lint`를 실행해 오류가 없는지 확인하세요.
- 개발 서버는 `npm run dev`로 실행되며 Turbopack을 사용합니다.
