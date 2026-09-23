# ChessTeacher

A chess training app: play against an adjustable-strength engine, study
openings move by move, and drill tactics — with live evaluation, a
coach that explains why a move was good or bad, and puzzles pulled
live from [Lichess](https://lichess.org).

## Features

- **Play** — play White or Black against a Stockfish opponent tuned to
  a chosen ELO. Every move gets a live evaluation and, on a mistake or
  blunder, a coach card explaining what went wrong and what was better.
  Review any past move, or the game's biggest swings, after it ends.
- **Openings** — step through full annotated lines for openings across
  every skill level, with a plain-language explanation for every move,
  or quiz yourself on the line from memory.
- **Sequences** — short, hand-verified tactical and checkmate patterns
  (forks, pins, skewers, back-rank mates, and more) in a puzzle mode
  with escalating hints, plus a "Watch" mode that steps through the
  solution with commentary.
- **Exercises** — pull a fresh, real puzzle for the same tactical theme
  straight from Lichess's puzzle database, live, on demand.
- Content, hints and evaluation depth adapt to a Beginner / Intermediate
  / Advanced / Expert skill level, set once in the header.

## Architecture

Two services, wired together with Docker Compose:

- **`web`** — the Next.js (App Router, TypeScript) app you interact with.
- **`engine`** — a small Node service that wraps a Stockfish binary,
  used for both playing moves (`UCI_Elo`-limited) and analyzing
  positions. It's not exposed outside the Docker network — `web`
  proxies to it server-side.

## Installation

No manual Node, npm or Stockfish setup, and no accounts, API keys or
configuration to fill in either way — just Docker.

### Option A: Pre-built images (easiest, no cloning)

Every push to `main` publishes ready-to-run images to GitHub Container
Registry. You only need one small file, not the repository:

```bash
curl -O https://raw.githubusercontent.com/crowndip/chessTeacher/main/docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
```

Requires Docker with the Compose plugin (see Prerequisites below).
Open **http://localhost:3000** once it's up.

To update later:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

#### Deploying with Portainer

Portainer can pull and deploy this directly from GitHub — nothing to
download by hand:

1. In Portainer, go to **Stacks → Add stack**.
2. Choose **Repository** as the build method.
3. Repository URL: `https://github.com/crowndip/chessTeacher`
4. Compose path: `docker-compose.prod.yml`
5. Deploy the stack. Portainer fetches the compose file and pulls the
   pre-built images itself.
6. Optional: turn on GitOps updates so Portainer redeploys
   automatically whenever `docker-compose.prod.yml` changes on `main`.

### Option B: Build from source

For contributors, or if you'd rather build the images yourself instead
of pulling them.

#### Prerequisites

- **Docker**, with the **Compose plugin** (`docker compose`, no hyphen).
  - Mac/Windows: install [Docker Desktop](https://www.docker.com/products/docker-desktop/) — it includes Compose.
  - Linux: install [Docker Engine](https://docs.docker.com/engine/install/) plus the
    [Compose plugin](https://docs.docker.com/compose/install/linux/) (most current
    distro packages bundle both already).
- **Git**, to get the code.
- About 1 GB of free disk space for the built images.

Check both are ready:

```bash
docker --version
docker compose version
```

#### 1. Get the code

```bash
git clone https://github.com/crowndip/chessTeacher.git
cd chessTeacher
```

#### 2. Build and start it

```bash
docker compose up -d --build
```

The first run builds both images from scratch (downloads Node and
Stockfish base layers, installs dependencies, compiles the app) —
expect a few minutes depending on your connection. `-d` runs it in
the background; drop it if you'd rather watch the logs in your
terminal.

#### 3. Open it

Visit **http://localhost:3000**. The engine container has no
published port by design — only `web` is reachable from outside
Docker, and it proxies engine requests server-side.

#### Updating to a newer version

```bash
git pull
docker compose up -d --build
```

Compose rebuilds only what changed and restarts the affected
container(s).

### Everyday use

Same commands for either option — add `-f docker-compose.prod.yml` if
you used Option A:

```bash
docker compose stop      # stop both containers, keep them for later
docker compose start     # start them again
docker compose down      # stop and remove the containers (images stay)
docker compose logs -f   # follow logs from both services
```

### Troubleshooting

- **Port 3000 already in use** — edit the `ports` line under `web` in
  your compose file (e.g. `"3001:3000"`) and reopen at the new port.
- **`docker compose` not found** — you likely have only the older,
  standalone `docker-compose` (with a hyphen); install the Compose
  plugin instead (see Prerequisites), or substitute `docker-compose`
  for `docker compose` in every command above.
- **Permission denied connecting to the Docker daemon** (Linux) — your
  user isn't in the `docker` group yet: run
  `sudo usermod -aG docker $USER`, then fully log out and back in.
- **A container won't start / crashes on startup** — check its logs:
  `docker compose logs web` or `docker compose logs engine`.

## Local development

For contributors working on the code directly (not just running it):

```bash
npm install
npm run dev
```

The dev server talks to `ENGINE_URL` (default `http://localhost:4000`)
for engine moves/analysis — you'll need the engine service running too
(`docker compose up -d --build engine`, or `cd engine && npm install &&
npm run dev` if you have a local `stockfish` binary on your `PATH`) for
Play, Sequences, and Exercises to work; Openings' static content works
without it.

## Checks

```bash
npm run typecheck
npm run build
```

See `AGENTS.md` for contributor guidelines.
