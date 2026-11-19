import { Telegraf } from "telegraf";
import { BOT_TOKEN } from "../config/env.ts";

export const bot = new Telegraf(BOT_TOKEN);

const commands = [
  { command: "start", description: "Start the bot" },
  { command: "help", description: "Show available commands" },
];

bot.start((ctx) =>
  ctx.reply(`Hi ${ctx.from.first_name}! Send /help to see what I can do.`)
);

bot.help((ctx) =>
  ctx.reply(commands.map((c) => `/${c.command} – ${c.description}`).join("\n"))
);

bot.on("text", (ctx) => ctx.reply(`You said: ${ctx.message.text}`));

bot.catch((err, ctx) => {
  console.error(`Error while handling update ${ctx.update.update_id}:`, err);
});

export async function registerCommands() {
  await bot.telegram.setMyCommands(commands);
}
