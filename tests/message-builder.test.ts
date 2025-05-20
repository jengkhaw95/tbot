import { describe, it, expect, vi } from "vitest";
import { MessageBuilder } from "../src/message-builder";
import { Bot } from "../src/bot";

describe("MessageBuilder", () => {
	it("should build and send a text message with buttons", async () => {
		const mockCallAPI = vi.fn().mockResolvedValue({ ok: true });
		const bot = new Bot("dummy-token") as any;
		bot.callAPI = mockCallAPI;

		const chatId = 123456;
		await new MessageBuilder(bot, chatId)
			.text("Hello")
			.buttons([[{ text: "OK", callback_data: "ok" }]])
			.send();

		expect(mockCallAPI).toHaveBeenCalledWith("sendMessage", {
			chat_id: chatId,
			text: "Hello",
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [[{ text: "OK", callback_data: "ok" }]],
			},
		});
	});

	it("should throw if text is not provided", async () => {
		const bot = new Bot("dummy-token") as any;
		bot.callAPI = vi.fn();

		const builder = new MessageBuilder(bot, 123);
		await expect(() => builder.send()).rejects.toThrow(
			"Cannot send a message without text",
		);
	});
});
