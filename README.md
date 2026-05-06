# TypeScript Next.js example

This is a really simple project that shows the usage of Next.js with TypeScript.

## Deploy your own

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=next-example) or preview live with [StackBlitz](https://stackblitz.com/github/vercel/next.js/tree/canary/examples/with-typescript)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/next.js/tree/canary/examples/with-typescript&project-name=with-typescript&repository-name=with-typescript)

## How to use it?

<token> 替换为自己的 telegram bot token

设置机器人 webhook：:

```bash
curl "https://api.telegram.org/bot<token>/setWebhook?url=https://example.vercel.app/api/telegram-bot?token=<token>"
```

查看机器人 webhook：:

```bash
curl "https://api.telegram.org/bot<token>/getWebhookInfo"
```

