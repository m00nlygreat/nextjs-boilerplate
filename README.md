This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Saju Palja Analysis

The main page accepts Korean natal chart information such as `정묘년 계축월 신사일 계사시 / 남성` and returns a detailed 사주팔자 리포트. The API combines web search snippets and the OpenAI Response API.

Set the `OPENAI_API_KEY` environment variable before running the server.

## /api/manse Testing Guide

Use the built-in API route to verify 만세력 계산이 예상대로 동작하는지 확인할 수 있습니다.

- 개발 서버 실행: `npm run dev` (기본 포트 3000)
- 기본 요청 예시(날짜/시간 분리):
  - `curl "http://localhost:3000/api/manse?date=1988-01-27&time=15:00&tz=9&lon=126.98&female=true&cycle=5"`
- 압축 형식 예시(stamp):
  - `curl "http://localhost:3000/api/manse?stamp=f198801271500&tz=9&lon=126.98&cycle=5"`

주요 쿼리 파라미터

| 이름 | 설명 | 기본값 |
| --- | --- | --- |
| `stamp` | `m`/`f` + `yyyymmddHHMM` (예: `f198801271500`). 제공 시 `date`/`time`/성별 플래그는 무시됩니다. | 없음 |
| `date` | `YYYY-MM-DD` 형식의 양력 날짜. `stamp`가 없을 때 필수. | 없음 |
| `time` | `HH:MM`(현지시) | `12:00` |
| `tz` | 시간대 오프셋(시간). 예: 한국 `9` | `9` |
| `lon` | 경도(도). 시각을 LMT로 조정할 때 사용 | `126.98` |
| `lmt` | `true`/`1`/`yes` 시 시주 경계를 LMT 기준으로 이동 | `false` |
| `cycle` | 운 세트 개수(10년 단위) | `10` |
| `female` / `male` | `true`/`false` 플래그. `stamp`를 사용할 때는 무시 | `male` |

각 요청 결과는 한글/한자 간지 문자열과 대운 시작 연령·날짜 등이 포함된 JSON으로 반환됩니다.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## DateTimePicker Component

A custom Korean date picker is available for entering dates as `yyyy-mm-dd` or typing `20250808`. It also provides a calendar popup that stays in sync with the input.

```tsx
import DateTimePicker from "@/app/components/DateTimePicker";
import { useState } from "react";

function Example() {
  const [date, setDate] = useState("");
  return <DateTimePicker value={date} onChange={setDate} />;
}
```

