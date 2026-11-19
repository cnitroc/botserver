const token = Deno.env.get("BOT_TOKEN");
if (!token) {
  throw new Error("BOT_TOKEN is not set. Add it to your environment or a .env file.");
}

export const BOT_TOKEN = token;
