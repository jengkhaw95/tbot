import type { Bot } from "./bot";

interface InlineButton {
	text: string;
	callback_data: string;
}

export class MessageBuilder {
	private textContent?: string;
	private inlineButtons: InlineButton[][] = [];

	constructor(
		private bot: Bot,
		private chatId: number,
	) {}

	text(content: string) {
		this.textContent = content;
		return this;
	}

	buttons(rows: InlineButton[][]) {
		this.inlineButtons = rows;
		return this;
	}

	async send() {
		if (!this.textContent) {
			throw new Error("Cannot send a message without text");
		}

		const payload: any = {
			chat_id: this.chatId,
			text: this.textContent,
			parse_mode: "HTML",
		};

		if (this.inlineButtons.length > 0) {
			payload.reply_markup = {
				inline_keyboard: this.inlineButtons,
			};
		}

		return this.bot.callAPI("sendMessage", payload);
	}
}
