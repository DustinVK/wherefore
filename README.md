<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/lockup-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset=".github/assets/lockup-light.svg">
  <img alt="wherefore" src=".github/assets/lockup-light.svg" width="280">
</picture>

# wherefore

The why behind your code. Capture the reasoning behind your technical decisions,
what you chose, why, and what you ruled out, as plain markdown that lives in your
repo.

## Quick start

**1. Add the plugin to Claude Code:**

```
/plugin marketplace add DustinVK/wherefore
/plugin install wherefore@dustinvk
```

**2. Capture a decision.** Paste your meeting notes, a transcript, or a Slack
thread into Claude and say `log this discussion` (or run `/wherefore:capture`).
wherefore distills it into a tagged markdown entry in your repo: what was decided,
why, and what was ruled out.

**3. (Optional) Browse it as a dashboard:**

```
npx @dustinvk/wherefore-dashboard dev
```

This renders your `wherefore/` directory as a local site. No install needed.

That's it. The rest of this README is detail for when you want it.

---

## What it is

wherefore is an open, plain-markdown record of the reasoning behind your technical
decisions. No cloud, no database, no vector store, no lock-in. Because the data is
just files in your repo, any tool or any person can read it.

There are three ways to work with it:

- **A Claude Code plugin** (the richest experience): skills that capture, query,
  resolve, and supersede decisions, with Claude handling the tagging and bookkeeping
  so the log actually gets maintained.
- **A static dashboard** ([`@dustinvk/wherefore-dashboard`](https://www.npmjs.com/package/@dustinvk/wherefore-dashboard)
  on npm): renders your `wherefore/` directory as a browsable site, deployable to
  Cloudflare Pages.
- **An `AGENTS.md` spec**: lets other coding agents (Codex, GitHub Copilot, Cursor,
  Gemini) read and maintain the log too, since the format is open.

Feed the plugin a discussion (raw notes, a transcript, an AI-generated summary, a
Slack thread) and it outputs compact entries capturing what was decided, why, and
what was rejected. Unresolved questions each get their own file in
`wherefore/questions/` with a one-line entry in `QUESTIONS.md` so nothing falls
through the cracks. An `INDEX.md` keeps everything scannable, so an agent can answer
"why did we build it this way?" directly from the repo without touching a wiki.

If you've used ADRs, this is the same instinct, with the capture, querying, question
lifecycle, and supersession bookkeeping handled for you so it actually gets
maintained.

## The plugin: skills and commands

- **`capture`** -- distills a raw or AI-generated discussion summary into one or
  more compact, tagged entries: what was decided, why, and what was rejected.
  Long discussions covering independent topics are split into one file per
  independently-queryable thread. Genuine unresolved questions each get an
  individual file in `wherefore/questions/` (Q-001.md, Q-002.md ...) and a one-line
  entry in `QUESTIONS.md`.
- **`ask`** -- answers "why did we build it this way?" / "what did we decide
  about X?" by searching the log, or tells you plainly when there's nothing.
  After answering, it surfaces any still-open questions in the same area.
- **`resolve`** -- closes out an open question by updating its
  `wherefore/questions/Q-NNN.md` file and the corresponding index line in
  `QUESTIONS.md`, recording the answer, the rationale, and a link to the
  discussion that settled it.
- **`supersede`** -- marks a past decision superseded (with a pointer to its
  replacement) or obsolete, without requiring a new discussion to be captured.
  Updates the entry file, adds a visible banner, and updates the INDEX line so
  both the `ask` skill and human readers see it is retired.
- **`/wherefore:seed`** -- inspects the codebase and proposes a starter set of areas
  and topics for `wherefore/topics.md`, with a short justification for each tag.
  Confirm or edit its proposal and it writes (or merges into) the file.

Entries are tagged on two facets: **areas** (feature slices: `order-process`,
`international-shipping`, `price-calculator`) and **topics** (cross-cutting
concerns: `auth`, `postgres`, `performance`). The log is committed to each
consuming project's repo, version-controlled and PR-reviewable next to the code.

## Other coding agents

The `wherefore/` log is plain markdown, so it is not tied to any one tool. An
`AGENTS.md` at the repo root describes the format and the capture, supersede, and
question workflows, so coding agents that read AGENTS.md (Codex, GitHub Copilot,
Cursor, Gemini, and others) can read and maintain the log by following the spec.

The Claude Code plugin remains the richest experience: it handles tagging,
supersession detection, multi-thread splitting, and the question lifecycle for you.
AGENTS.md is the shared floor that lets any agent keep the log accurate, not full
parity with the plugin. The data format is the same either way, so you can mix
tools and the log stays consistent.

## The dashboard

[`@dustinvk/wherefore-dashboard`](https://www.npmjs.com/package/@dustinvk/wherefore-dashboard)
renders your `wherefore/` directory as a browsable static site. No install needed:

```
npx @dustinvk/wherefore-dashboard dev
```

from any directory containing a `wherefore/` folder. See the
[package README](packages/wherefore-dashboard/README.md) for build options, local
preview, and deploying to Cloudflare Pages.

## Setup tips

First-time setup in a project (optional but recommended):

1. Paste the block from `CLAUDE.snippet.md` into the project's `CLAUDE.md`. This
   makes Claude offer to capture a decision when a session reaches one, so
   capturing becomes a "yes" instead of a chore someone has to remember.
2. Run `/wherefore:seed` and Claude inspects the codebase (module layout, routes,
   dependency manifests, migrations) and proposes a starter set of areas and
   topics. Confirm or edit its proposal and it writes (or merges into)
   `wherefore/topics.md`.

Both steps are optional. The log still works without them; the trigger just
becomes manual and the vocabulary grows organically as you go.

On first use in a project, `capture` scaffolds a `wherefore/` folder (`INDEX.md`,
`QUESTIONS.md`, a starter `topics.md`, a `log/` subdirectory, and a `questions/`
subdirectory) in that repo. The plugin ships the tooling; the log itself is
per-project data. Restart Claude Code once after installing so the new skills are
picked up.

## How a session flows

End of a huddle: paste the summary and say "log this discussion". `capture`
distills it, tags it, and writes one file per independently-queryable decision
thread under `wherefore/log/`. A long, meandering discussion can produce several files
if its threads are unrelated enough to be searched separately. If the discussion
leaves genuine unresolved questions, each gets its own file in `wherefore/questions/`
(e.g. `Q-001.md`) with a one-line entry in `QUESTIONS.md`.

Later, ask "why did we implement the price calculator the way we did?" and `ask`
searches the log, summarizes the relevant entries (with dates and source files),
and appends any still-open questions in the same area.

When a question gets answered, say "mark Q-007 resolved -- we decided X because
Y" (or name the log entry if you just logged it). `resolve` updates
`QUESTIONS.md` and annotates the source entry so the audit trail is complete.

**Question lifecycle:** `capture` creates questions, `ask` surfaces them,
`resolve` closes them.

**Decision lifecycle:** `capture` captures (and supersedes on the way in),
`supersede` retires entries after the fact, `ask` follows chains to the active
answer.

## Repo layout

```
wherefore/
├── AGENTS.md                          # cross-agent instructions (Codex, Copilot, Cursor, Gemini)
├── .claude-plugin/
│   └── marketplace.json               # the registry
├── .github/
│   ├── assets/                        # brand assets (lockups, favicons, og-card)
│   └── workflows/
│       └── validate-plugins.yml       # CI: validates manifests + plugin on every push
├── packages/
│   └── wherefore-dashboard/           # the static dashboard (published to npm)
├── plugins/
│   └── wherefore/
│       ├── .claude-plugin/
│       │   └── plugin.json            # plugin manifest
│       ├── CLAUDE.snippet.md          # paste into a project's CLAUDE.md
│       ├── commands/
│       │   └── seed.md                # /wherefore:seed -- bootstrap vocabulary from the codebase
│       └── skills/
│           ├── capture/
│           │   ├── SKILL.md           # capture skill
│           │   └── topics.seed.md     # starter vocabulary, copied on first run
│           ├── ask/
│           │   └── SKILL.md           # query skill
│           ├── resolve/
│           │   └── SKILL.md           # close out open questions
│           └── supersede/
│               └── SKILL.md           # retire decisions (superseded or obsolete)
└── README.md
```

Each consuming project's log lives in its own repo, not here:

```
<your-project>/
└── wherefore/
    ├── INDEX.md          # one line per entry; maintained by capture
    ├── QUESTIONS.md      # one-line-per-question index
    ├── topics.md         # controlled tag vocabulary (areas + topics)
    ├── questions/
    │   └── Q-NNN.md      # one file per question
    └── log/
        └── YYYY-MM-DD-short-slug.md   # one file per independently-queryable thread
```

## Publishing the plugin yourself

1. Validate locally: `claude plugin validate ./plugins/wherefore`
   (a GitHub Actions workflow also runs this on every push and pull request, so
   a future edit can't quietly break the manifest for people who've installed it).
2. Test locally before pushing: `/plugin marketplace add ./` from this repo,
   then `/plugin install wherefore@dustinvk`.
3. Push to github.com/DustinVK/wherefore. Users add it with
   `/plugin marketplace add DustinVK/wherefore`.
   Updates are just commits; users run `/plugin marketplace update` to refresh.

GitHub topics to add: `claude-code`, `claude-code-plugin`, `agents-md`,
`architecture-decision-records`, `adr`, `decision-log`, `knowledge-management`.

Private repo? Auto-updates need a `GITHUB_TOKEN` / `GH_TOKEN` in the environment.

## License

MIT.