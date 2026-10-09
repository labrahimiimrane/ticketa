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

Ticketa runs on [Render](https://render.com) as one Node web service, defined in
`render.yaml`. Puppeteer downloads Chrome into `.cache/puppeteer` during
`npm ci` (see `.puppeteerrc.cjs`), so the browser built on Render is still there
when the service starts. No environment variables are needed.

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. In the Render dashboard choose **New > Blueprint**, select the repository, and
   apply `render.yaml`.
3. Wait for the deploy to finish, then run the smoke checks below against the
   service URL.

```bash
URL=https://<your-service>.onrender.com
BODY='{"event":{"name":"Launch Night","date":"2026-11-20","time":"19:30","location":"Main Hall","organizer":"Ticketa"},"attendee":{"name":"Sam Lee"},"ticketId":"TKT-ABCD-2345","templateId":"classic","branding":{"logo":null,"colors":{"accent":"#8B5CF6"}}}'

curl -s -o /dev/null -w "GET / %{http_code}\n" "$URL/"
curl -s -o ticket.png -w "PNG %{http_code} %{content_type}\n" -H "Content-Type: application/json" -d "$BODY" "$URL/api/export/png"
curl -s -o ticket.pdf -w "PDF %{http_code} %{content_type}\n" -H "Content-Type: application/json" -d "$BODY" "$URL/api/export/pdf"
```

Expect `200` for all three, `image/png` and `application/pdf` content types, and
files that open and match the preview. To try it locally, run `npm run build`
and `npm run start`, then use `URL=http://localhost:3000`.
