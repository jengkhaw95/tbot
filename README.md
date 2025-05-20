# @jengkhaw95/tbot

A simple and easy-to-use Telegram bot API wrapper for TypeScript.

## Installation

```bash
npm install @jengkhaw95/tbot
# or
yarn add @jengkhaw95/tbot
# or
pnpm add @jengkhaw95/tbot
```

## Quick Start

```typescript
import { Bot } from '@jengkhaw95/tbot';

// Initialize bot with your token
const bot = new Bot('YOUR_BOT_TOKEN');

// Handle messages
bot.onMessage(async (message) => {
  if (message.text) {
    await bot.message(message.chat.id)
      .text(`You said: ${message.text}`)
      .send();
  }
});

// Handle commands
bot.command('/start', async (ctx) => {
  await bot.message(ctx.message.chat.id)
    .text('Welcome! Bot is started.')
    .send();
});

// Start polling for updates
bot.startPolling();
```

## Features

- 🚀 Simple and intuitive API
- 💪 Full TypeScript support
- 🛠 Built-in message builder
- 🔄 Supports both polling and webhook modes
- ⚡️ Middleware support
- 🎮 Inline keyboard support

## API Reference

### Bot Class

#### Constructor

```typescript
const bot = new Bot(token: string);
```

#### Methods

- `message(chatId: number)`: Creates a new MessageBuilder instance
- `startPolling(interval?: number)`: Starts polling for updates
- `stopPolling()`: Stops polling for updates
- `setWebhook(url: string)`: Sets up a webhook
- `deleteWebhook()`: Removes the webhook
- `onMessage(handler: MessageHandler)`: Handles incoming messages
- `onUpdate(handler: UpdateHandler)`: Handles all updates
- `onCallbackQuery(handler: CallbackQueryHandler)`: Handles callback queries
- `command(cmd: string, handler: CommandHandler)`: Handles specific commands
- `use(middleware: MiddlewareFn)`: Adds middleware

### MessageBuilder

Used for constructing messages with inline keyboards.

```typescript
bot.message(chatId)
  .text('Choose an option:')
  .buttons([[
    { text: 'Option 1', callback_data: 'opt1' },
    { text: 'Option 2', callback_data: 'opt2' }
  ]])
  .send();
```

## Examples

### Using Middleware

```typescript
// Log all updates
bot.use(async (ctx, next) => {
  console.log('Update received:', ctx.update);
  await next();
});
```

### Handling Inline Keyboards

```typescript
// Create buttons
bot.command('/menu', async (ctx) => {
  await bot.message(ctx.message.chat.id)
    .text('Select an option:')
    .buttons([[
      { text: 'Option 1', callback_data: 'opt1' },
      { text: 'Option 2', callback_data: 'opt2' }
    ]])
    .send();
});

// Handle button clicks
bot.onCallbackQuery((query) => {
  if (query.data === 'opt1') {
    // Handle Option 1
  }
});
```

### Using Webhook Mode

```typescript
// Initialize bot with token and optional secret token
const bot = new Bot({
  token: 'YOUR_BOT_TOKEN',
  secretToken: 'YOUR_SECRET_TOKEN' // Optional, for webhook security
});

// Set up webhook
await bot.setWebhook('https://your-domain.com/webhook');

// In your HTTP server, validate the secret token
app.post('/webhook', async (req, res) => {
  // Validate using headers
  if (!bot.validateSecretToken(req.headers)) {
    return res.sendStatus(401);
  }
  
  await bot.handleWebhookRequest(req.body);
  res.sendStatus(200);
});

// Alternatively, validate using the token string directly
if (!bot.validateSecretToken('YOUR_SECRET_TOKEN')) {
  // Handle invalid token
}
```

The `validateSecretToken` method helps secure your webhook endpoint by verifying the `X-Telegram-Bot-Api-Secret-Token` header or comparing directly with a token string. When a secret token is set during bot initialization, Telegram will include this token in webhook requests, allowing you to verify that the requests are genuine.
