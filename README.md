# Discussion Log — a Claude Code plugin marketplace

A self-hosted [Claude Code](https://code.claude.com) plugin marketplace that
distributes **discussion-log**: two skills for capturing the useful residue
of technical discussions and querying it later.

- **`discussion-log`** — distills a (raw or AI-generated) discussion summary into
  one compact, tagged entry: *what was decided, why, and what was rejected* — not
  a transcript.
- **`discussion-read`** — answers "why did we build it this way?" /
  "what did we decide about X?" by searching the log, or tells you plainly when
  there's nothing.

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
(`INDEX.md` + a starter `topics.md`) in that repo — the plugin ships the tooling,
the log itself is per-project data.

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

End of a huddle — paste the summary and say *"log this discussion"*. Later, ask
*"why did we implement the price calculator the way we did?"* and `discussion-read`
searches the log and summarizes the relevant entries (with dates and source
files), or says it found nothing.

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
│           │   ├── SKILL.md
│           │   └── topics.seed.md     # starter vocabulary, copied on first run
│           └── discussion-read/
│               └── SKILL.md
└── README.md
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

MIT (placeholder — change to whatever you prefer, and update `plugin.json`).
