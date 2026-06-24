# Discussion Log — a Claude Code plugin marketplace

Feed it a discussion — raw notes, a transcript, an AI-generated summary, a
Slack thread — and it outputs condensed log files capturing what was decided,
why, and what was rejected. Unresolved questions get extracted into a
`QUESTIONS.md` registry so nothing falls through the cracks. An `INDEX.md`
keeps everything scannable by LLMs, making past decisions easy to query later
without re-reading the whole log.

## In Detail

A self-hosted [Claude Code](https://code.claude.com) plugin marketplace that
distributes **discussion-log**: three skills for capturing the useful residue
of technical discussions, querying it later, and closing out open questions.

- **`discussion-log`** — distills a (raw or AI-generated) discussion summary
  into one or more compact, tagged entries: *what was decided, why, and what
  was rejected* — not a transcript. Long discussions that cover independent
  topics are split into one file per independently-queryable thread. Genuine
  unresolved questions are extracted into a `QUESTIONS.md` registry with
  sequential IDs (Q-001, Q-002 …).
- **`discussion-read`** — answers "why did we build it this way?" /
  "what did we decide about X?" by searching the log, or tells you plainly
  when there's nothing. After answering, it also surfaces any still-open
  questions in the same area from `QUESTIONS.md`.
- **`question-resolve`** — closes out an open question in `QUESTIONS.md`,
  recording the answer, the rationale, and a link to the discussion that
  settled it (or marking it standalone if there's no new log entry).

Entries are tagged on two facets — **areas** (feature slices: `order-process`,
`international-shipping`, `price-calculator`) and **topics** (cross-cutting
concerns: `auth`, `postgres`, `performance`). The log is committed to each
consuming project's repo, version-controlled and PR-reviewable next to the code.

## Install (for users of this marketplace)

```
/plugin marketplace add DustinVK/discussion-log
/plugin install discussion-log@dustinvk
```

Restart Claude Code once after installing so the new skills are picked up. On
first use in a project, `discussion-log` scaffolds a `discussions/` folder
(`INDEX.md`, `QUESTIONS.ms` a starter `topics.md`, and a `log/` subdirectory) in that repo —
the plugin ships the tooling, the log itself is per-project data.

### Usage

First-time setup in a project (optional but recommended):

1. Paste the block from `CLAUDE.snippet.md` into the project's `CLAUDE.md`. This
   makes Claude *offer* to log a decision when a session reaches one — capturing
   becomes a "yes" instead of a chore someone has to remember, which is the
   single biggest driver of whether the log actually gets used.
2. Run `/discussion-log:seed-topics` and Claude inspects the codebase —
   module layout, routes, dependency manifests, migrations — and proposes a
   starter set of **areas** and **topics**, with a short justification for each
   tag. Confirm or edit its proposal and it writes (or merges into)
   `discussions/topics.md`.

Both steps are optional — the log still works without them; the trigger just
becomes manual and the vocabulary grows organically as you log.

End of a huddle — paste the summary and say *"log this discussion"*.
`discussion-log` distills it, tags it, and writes one file per independently-queryable
decision thread under `discussions/log/` — a long, meandering discussion can produce
several files if its threads are unrelated enough to be searched separately. If the discussion leaves genuine
unresolved questions, they land in `discussions/QUESTIONS.md` with IDs like
Q-001, Q-002 — prefixed in the entry so nothing gets lost.

Later, ask *"why did we implement the price calculator the way we did?"* and
`discussion-read` searches the log, summarizes the relevant entries (with dates
and source files), and appends any still-open questions in the same area — so
you know what's still unsettled without having to remember to check.

When a question gets answered, say *"mark Q-007 resolved — we decided X because
Y"* (or name the discussion entry if you just logged it). `question-resolve`
updates `QUESTIONS.md` and annotates the source entry so the audit trail is
complete.

**Question lifecycle in one line:**
`discussion-log` creates questions → `discussion-read` surfaces them → `question-resolve` closes them.

## Repo layout

```
discussion-log/
├── .claude-plugin/
│   └── marketplace.json               # the registry
├── .github/
│   └── workflows/
│       └── validate-plugins.yml       # CI: validates manifests + plugin on every push
├── plugins/
│   └── discussion-log/
│       ├── .claude-plugin/
│       │   └── plugin.json            # plugin manifest
│       ├── CLAUDE.snippet.md          # paste into a project's CLAUDE.md (opt-out logging)
│       ├── commands/
│       │   └── seed-topics.md         # /seed-topics — bootstrap vocabulary from the codebase
│       └── skills/
│           ├── discussion-log/
│           │   ├── SKILL.md           # capture skill
│           │   └── topics.seed.md     # starter vocabulary, copied on first run
│           ├── discussion-read/
│           │   └── SKILL.md           # query skill
│           └── question-resolve/
│               └── SKILL.md           # close out open questions
└── README.md
```

Each consuming project's log lives in its own repo, not here:

```
<your-project>/
└── discussions/
    ├── INDEX.md          # one line per entry; maintained by discussion-log
    ├── topics.md         # controlled tag vocabulary (areas + topics)
    ├── QUESTIONS.md      # open/resolved question registry (created on first open question)
    └── log/
        └── YYYY-MM-DD-short-slug.md   # one file per independently-queryable thread
```

## Publishing this yourself

1. Validate locally: `claude plugin validate ./plugins/discussion-log`
   (a GitHub Actions workflow also runs this on every push and pull request, so
   a future edit can't quietly break the manifest for people who've installed it).
2. Test locally before pushing: `/plugin marketplace add ./` from this repo,
   then `/plugin install discussion-log@dustinvk`.
3. Push to github.com/DustinVK/discussion-log — users add it with
   `/plugin marketplace add DustinVK/discussion-log`.
   Updates are just commits; users run `/plugin marketplace update` to refresh.

Private repo? Auto-updates need a `GITHUB_TOKEN` / `GH_TOKEN` in the environment.

## License

MIT.
