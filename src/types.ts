export interface TelegramMessage {
	message_id: number;
	chat: {
		id: number;
		type: "private" | "group" | "supergroup" | "channel";
		title?: string;
		username?: string;
		first_name?: string;
		last_name?: string;
	};
	text?: string;
	date: number;
	from?: {
		id: number;
		is_bot: boolean;
		first_name: string;
		last_name?: string;
		username?: string;
		language_code?: string;
	};
}

export interface CallbackQuery {
	id: string;
	from: TelegramMessage["from"];
	message?: TelegramMessage;
	data?: string;
}

export interface Update {
	update_id: number;
	message?: TelegramMessage;
	callback_query?: CallbackQuery;
}
