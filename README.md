# Official Bot

A private, modular personal assistant for Telegram, built with **grammY** and **TypeScript** on **Deno**.

> [!WARNING]
> The project is in active development. Interfaces and structure may change between phases.

> [!NOTE]
> The goal is a personal assistant on Telegram: practical everyday tools first, then integration with **Karl**, my separately developed AI assistant.

---

## Table of Contents

- [Vision](#vision)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Roadmap](#roadmap)
- [Engineering Rules](#engineering-rules)
- [Development Workflow](#development-workflow)

---

## Vision

The bot is the single Telegram interface for my daily tools. It is **not** just a downloader.

- **Personal assistant first.** It is private and serves one authorized user.
- **Media processing** is the first practical capability.
- **Karl** is the first major AI integration. It plugs in through an adapter, and the bot must keep working without it.
- **Learning project.** I write the code myself to become independent in TypeScript and backend development. AI tools explain, review and give hints. They do not write the implementation for me.

### Core principles

1. Modular architecture: features are independent modules.
2. Security: only the owner can use the bot. Secrets stay out of source code.
3. Maintainable, testable code.
4. Local-first where practical.
5. Grow step by step. Add no dependency or infrastructure before it solves a real problem.

---

## Tech Stack

| Component            | Technology                                  |
| -------------------- | ------------------------------------------- |
| Runtime              | Deno                                        |
| Language             | TypeScript                                  |
| Telegram framework   | grammY                                      |
| Media downloading    | yt-dlp (external CLI, via `Deno.Command`)   |
| Video/audio processing | FFmpeg (external CLI, via `Deno.Command`) |
| Configuration        | Environment variables / `.env`              |
| Testing              | `Deno.test`                                 |
| Version control      | Git                                         |
| Development OS       | Windows (later deployment target: Linux VPS) |

---

## Getting Started

### Prerequisites

- [Deno](https://deno.com/)
- A bot token from [@BotFather](https://t.me/BotFather)
- Your Telegram user ID (for example from [@userinfobot](https://t.me/userinfobot))
- *(Phase 2)* `yt-dlp` and `ffmpeg` available on `PATH`

### Setup

1. Create a `.env` file in the project root. It is ignored by Git.

   ```env
   BOT_TOKEN=123456789:your-token-here
   OWNER_ID=123456789
   ```

2. Run in development mode (restarts when files change):

   ```sh
   deno task dev
   ```

3. Run normally:

   ```sh
   deno task start
   ```

4. Run the tests:

   ```sh
   deno test
   ```

---

## Project Structure

### Current

```text
bot/
├── src/
│   ├── index.ts          # Entry point: starts the bot, handles shutdown
│   ├── bot/
│   │   └── index.ts      # Bot setup: /start, /help, echo, error handler
│   └── config/
│       └── env.ts        # Reads and validates environment variables
├── deno.json             # Tasks, imports, compiler options
├── deno.lock
├── .env                  # Local secrets (not committed)
└── README.md
```

### Target (grows phase by phase)

```text
src/
├── index.ts              # Entry point
├── bot/                  # Telegram interface: bot instance, middleware, wiring
│   ├── index.ts
│   └── middleware/
│       └── auth.ts       # Owner-only access
├── config/
│   └── env.ts
├── core/                 # Shared infrastructure: logger, errors, module types
│   ├── logger.ts
│   ├── errors.ts
│   └── module.ts         # The module interface
├── modules/              # Independent features
│   ├── core/             # /start, /help
│   ├── media/            # Phase 2
│   └── karl/             # Phase 4 — adapter only
├── services/             # Business logic that does not depend on Telegram
│   ├── downloader/       # yt-dlp adapter
│   ├── ffmpeg/           # FFmpeg adapter
│   └── jobs/             # Long-running jobs, progress, cancellation
└── tests/
```

---

## Architecture

The bot is a modular monolith: one process with clear internal boundaries, and no microservices.

```text
Telegram (grammY)
       │
   Middleware ── auth (owner only) ── logging ── error handling
       │
   Module Registry
       ├── core      (/start, /help)
       ├── media     (YouTube, Instagram, round video, audio)
       ├── karl      (adapter → external Karl service)
       └── ...       (notes, reminders, utilities)
       │
   Services (Telegram-independent)
       ├── downloader adapter (yt-dlp)
       ├── ffmpeg adapter
       ├── job manager
       └── storage
```

### Key boundaries

- **Handlers stay thin.** A handler parses input, calls a service and sends a reply. All logic lives in services.
- **Modules** register their own handlers through a grammY `Composer`. Removing a module must not break the other modules.
- **Third-party tools** (yt-dlp, FFmpeg) are wrapped behind adapters. Nothing else calls them directly.
- **Karl** is reached only through `modules/karl`. Karl's persona, memory and model logic stay inside the Karl project. If Karl fails, everything else keeps working.

---

## Roadmap

### Phase 1 — Foundation *(current)*

- [ ] Port from Telegraf to grammY
- [ ] Config: validate `BOT_TOKEN` and `OWNER_ID` at startup and fail fast
- [ ] Owner-only auth middleware, with a pure `isAuthorized()` function
- [ ] Logger and central error handling (`bot.catch`)
- [ ] Module interface; move /start and /help into the `core` module
- [ ] Tests for config, auth and failure cases
- [ ] Clean shutdown

**Done when:** the bot runs reliably, ignores unauthorized users, and new modules can be added without changing unrelated code.

### Phase 2 — Media Engine

- YouTube video and audio download
- Instagram Reels, posts and Stories (only where authorized; never bypass access controls)
- Convert videos to Telegram round video messages
- Extract audio from videos
- Progress reporting, cancellation, file-size validation, temp-file cleanup, concurrency limits

### Phase 3 — Modular Assistant

- Module registry, shared services, background job manager, per-module config, more tests

### Phase 4 — Karl Integration

- Inspect the Karl project, define the integration boundary, implement the adapter
- Controlled tool access for Karl, with confirmation for consequential actions

### Phase 5 — Productivity

- Notes, reminders, saved links, searchable history, utilities (translation, QR, summarization)

### Phase 6 — Deployment

- Linux VPS deployment, persistent jobs, restart recovery, monitoring, backups

---

## Engineering Rules

1. No business logic in Telegram handlers.
2. Modules are independent of each other.
3. External tools and libraries go behind adapters.
4. Never block the event loop. Run long work as async jobs.
5. Validate all user input and URLs.
6. Only the owner can use the bot.
7. Secrets live in `.env`, never in code.
8. Error messages to the user are clear and short. Full details go to the log.
9. Always clean up temporary files, including when a job fails.
10. Test failure paths, not just the success path.
11. Record important decisions in this README or in `docs/`.
12. No premature abstraction.

### Failure scenarios to test

Invalid URLs · unsupported media · oversized files · missing FFmpeg/yt-dlp · interrupted downloads · expired authentication · concurrent requests · restart during a job · unauthorized users

---

## Development Workflow

Each milestone is small and follows the same cycle:

1. **Scope.** Define exactly what this step covers.
2. **Design.** Explain the decision before writing code.
3. **Implement.** I write the code myself.
4. **Test.** Add `Deno.test` cases, including failures.
5. **Review.** Look for issues and ask why each choice was made.
6. **Document.** Update this README and the roadmap checkboxes.

### Notes for AI assistants

- **Do not write the implementation.** Explain concepts, review my code, point out problems and ask questions.
- Give a **hint** first. Give the full answer only when I ask for it.
- Follow the stack, structure and rules above. Don't add dependencies without discussing them first.
- Karl is a separate project and is not available yet. Don't assume how it works.