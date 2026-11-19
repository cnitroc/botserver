import { bot, registerCommands } from "./bot/index.ts";

await registerCommands();

// launch() resolves only when the bot stops, so don't await it here.
bot.launch(() => console.log("Bot is running. Press Ctrl+C to stop."));

const shutdown = (signal: string) => {
  bot.stop(signal);
  Deno.exit(0);
};
Deno.addSignalListener("SIGINT", () => shutdown("SIGINT"));
if (Deno.build.os !== "windows") {
  Deno.addSignalListener("SIGTERM", () => shutdown("SIGTERM"));
}
