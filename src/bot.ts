import type { Update, TelegramMessage, CallbackQuery } from "./types";
import { MessageBuilder } from "./message-builder";

type UpdateHandler = (update: Update) => void;
type MessageHandler = (msg: TelegramMessage) => void;
type CallbackQueryHandler = (cb: CallbackQuery) => void;

type MiddlewareFn = (
	ctx: UpdateContext,
	next: () => Promise<void>,
) => void | Promise<void>;
type CommandHandler = (ctx: UpdateContext) => void | Promise<void>;

export interface UpdateContext {
	update: Update;
	message?: TelegramMessage;
	callbackQuery?: CallbackQuery;
	bot: Bot;
	command?: string; // e.g. "/start"
	payload?: string; // e.g. "John Doe"
}

export class Bot {
	private offset = 0;
	private polling = false;

	private updateHandler?: UpdateHandler;
	private messageHandler?: MessageHandler;
	private callbackQueryHandler?: CallbackQueryHandler;

	private middlewares: MiddlewareFn[] = [];
	private commandHandlers: Map<string, CommandHandler> = new Map();
	private callbackQueryHandlers: Map<
		string,
		(ctx: UpdateContext) => void | Promise<void>
	> = new Map();

	private token: string;
	private secretToken?: string;

	constructor({ token, secretToken }: { token: string; secretToken?: string }) {
		this.token = token;
		this.secretToken = secretToken;
	}

	private get apiUrl() {
		return `https://api.telegram.org/bot${this.token}`;
	}

	async callAPI(method: string, payload: object = {}) {
		const res = await fetch(`${this.apiUrl}/${method}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		const data = await res.json();
		if (!data.ok) throw new Error(data.description);
		return data.result;
	}

	message(chatId: number) {
		return new MessageBuilder(this, chatId);
	}

	onUpdate(handler: UpdateHandler) {
		this.updateHandler = handler;
	}

	onMessage(handler: MessageHandler) {
		this.messageHandler = handler;
	}

	onCallbackQuery(handler: CallbackQueryHandler) {
		this.callbackQueryHandler = handler;
	}

	use(mw: MiddlewareFn) {
		this.middlewares.push(mw);
	}

	command(cmd: string, handler: CommandHandler) {
		this.commandHandlers.set(cmd, handler);
	}

	validateSecretToken(input: Headers | string) {
		if (this.secretToken === undefined) {
			return true;
		}
		if (input instanceof Headers) {
			const token = input.get("X-Telegram-Bot-Api-Secret-Token");
			return token === this.secretToken;
		}

		return input === this.secretToken;
	}

	async setWebhook(url: string) {
		await this.callAPI("setWebhook", { url, secret_token: this.secretToken });
	}

	async deleteWebhook() {
		await this.callAPI("deleteWebhook");
	}

	async handleWebhookRequest(update: any) {
		if (update.update_id) {
			this.updateHandler?.(update);

			if (update.message) {
				this.messageHandler?.(update.message);
			}

			if (update.callback_query) {
				this.callbackQueryHandler?.(update.callback_query);
			}

			await this.callMiddleware(update);
		}
	}

	async startPolling(interval = 1000) {
		this.polling = true;
		while (this.polling) {
			try {
				const updates: Update[] = await this.callAPI("getUpdates", {
					offset: this.offset,
					timeout: 30,
				});

				for (const update of updates) {
					this.offset = update.update_id + 1;

					this.updateHandler?.(update);
					if (update.message) this.messageHandler?.(update.message);
					if (update.callback_query)
						this.callbackQueryHandler?.(update.callback_query);

					await this.callMiddleware(update);
				}
			} catch (err) {
				console.error("Polling error:", err);
			}

			await new Promise((resolve) => setTimeout(resolve, interval));
		}
	}

	stopPolling() {
		this.polling = false;
	}

	private async callMiddleware(update: Update) {
		const ctx: UpdateContext = {
			update,
			message: update.message,
			callbackQuery: update.callback_query,
			bot: this,
		};

		const text = ctx.message?.text?.trim();
		if (text && text.startsWith("/")) {
			const firstSpace = text.indexOf(" ");
			const command = firstSpace === -1 ? text : text.slice(0, firstSpace);
			const payload =
				firstSpace === -1 ? "" : text.slice(firstSpace + 1).trim();

			ctx.command = command;
			ctx.payload = payload;

			const handler = this.commandHandlers.get(command);
			if (handler) {
				await handler(ctx);
				return;
			}
		}

		let i = 0;
		const next = async () => {
			if (i < this.middlewares.length) {
				const mw = this.middlewares[i++];
				await mw(ctx, next);
			}
		};

		await next();
	}
}
