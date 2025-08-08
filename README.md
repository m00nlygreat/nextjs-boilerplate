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

