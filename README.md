This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

Ticketa deploys to [Vercel](https://vercel.com) as a Next.js project. PNG and PDF
export run Puppeteer inside a Vercel function using the serverless Chromium build
from `@sparticuz/chromium`; Vercel builds skip Puppeteer's own Chrome download
(see `.puppeteerrc.cjs`). No environment variables are needed.

1. In the Vercel dashboard choose **Add New > Project** and import
   `labrahimiimrane/ticketa`. The Next.js framework preset and build settings are
   detected automatically.
2. Export loads the deployment's own `/render/ticket` page, so the deployment must
   be publicly reachable. Preview deployments are behind Vercel Authentication by
   default; turn it off in **Settings > Deployment Protection** to test previews.
3. When the deployment is ready, run the smoke checks below against its URL.

```bash
URL=https://<your-deployment>.vercel.app
BODY='{"event":{"name":"Launch Night","date":"2026-11-20","time":"19:30","location":"Main Hall","organizer":"Ticketa"},"attendee":{"name":"Sam Lee"},"ticketId":"TKT-ABCD-2345","templateId":"classic","branding":{"logo":null,"colors":{"accent":"#8B5CF6"}}}'

curl -s -o /dev/null -w "GET / %{http_code}\n" "$URL/"
curl -s -o ticket.png -w "PNG %{http_code} %{content_type}\n" -H "Content-Type: application/json" -d "$BODY" "$URL/api/export/png"
curl -s -o ticket.pdf -w "PDF %{http_code} %{content_type}\n" -H "Content-Type: application/json" -d "$BODY" "$URL/api/export/pdf"
```

Expect `200` for all three, `image/png` and `application/pdf` content types, and
files that open and match the preview. To try it locally, run `npm run build`
and `npm run start`, then use `URL=http://localhost:3000`.
