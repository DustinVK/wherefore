# Prompt — restyle the wherefore dashboard to the "1A" reading view

Paste the text below into your coding agent (Claude Code, etc.), running in the repo that renders the wherefore dashboard. Drop `wherefore-1A.css` into the project first (e.g. `src/styles/wherefore-1A.css`) and adjust the import path in the prompt.

---

Restyle the decision-entry view of this dashboard to a scannable, verdict-led reading layout. Use the stylesheet at `src/styles/wherefore-1A.css` as the source of truth for all colors, type, and spacing — import it, do not re-derive tokens. It defines CSS variables (`--wf-*`) and component classes under `.wf-entry`. Keep the dark + teal wherefore brand; the goal is readability, not a new palette.

**Type:** IBM Plex superfamily (loaded by the CSS): Plex Sans for UI and decision verdicts, Plex Mono for labels/tags/IDs/dates, Plex Serif for the Summary and Why prose.

**Render one decision entry with this structure and classes:**

- Wrapper `.wf-entry`. Inside, top to bottom:
  1. `.wf-logo` — the four-dot mark + "wherefore" wordmark (markup in the CSS comments).
  2. `.wf-head` — `.wf-title` (frontmatter `title`) on the left, `.wf-status` pill on the right. Status text from frontmatter `status`: `active` → default (teal), `superseded` → add class `is-superseded`, `obsolete` → `is-obsolete`.
  3. `.wf-meta` — one `.wf-chip.area` per `areas[]`, one `.wf-chip.topic` per `topics[]`, one `.wf-chip.story` per `stories[]` (wrap the id in `[…]`), then `.wf-date` (frontmatter `date`) pushed to the right.
  4. `.wf-summary` > `<p>` — the `## Summary` section.
  5. `.wf-label` "Decisions / outcomes", then the decision rows (below).
  6. `.wf-label` "Why", then `## Why` paragraphs each as `<p class="wf-why">`.
  7. `.wf-label` "Alternatives considered", then `.wf-alts` (skip the whole block if the section is absent).
  8. `.wf-label warn` "Open questions", then `.wf-qs`.

**The critical transform — verdict-led decisions.** Each `## Decisions / outcomes` list item becomes a `.wf-decision` row:

```html
<div class="wf-decision">
  <span class="n">01</span>
  <div>
    <p class="verdict">Start inventory-based, move to direct later.</p>
    <p class="detail">Two paths exist: direct (seller ships to buyer) and via inventory…</p>
  </div>
</div>
```

Split each bullet into a lead clause and elaboration: take the text up to and including the first sentence-ending period as `.verdict`, and the remainder as `.detail`. If a bullet is a single sentence, render only `.verdict`. Number rows `01, 02, …` (zero-padded) in source order. This is what kills the wall-of-text: someone reading only the bold verdict lines should still get every outcome. Do not bold anything mid-sentence — the lead clause carries the scan.

**Alternatives** (`## Alternatives considered`, format "Option X, rejected because …"): each item →

```html
<div class="wf-alt"><span class="tag">Rejected</span>
  <div class="txt"><b>Direct-first fulfillment.</b> <span>Needs net-new drop-ship plumbing…</span></div>
</div>
```

Bold clause = the option; muted span = the reason (strip a leading "rejected because").

**Open questions** (`## Open questions / follow-ups`): each item →

```html
<div class="wf-q"><span class="id">Q-014</span><span class="txt">How should browse-time pricing work…</span></div>
```

Pull the leading `Q-NNN:` into `.id`; if a question has no id, omit the chip. Render nothing (or a muted "None") when the section is empty.

**Do not** change routing, data loading, frontmatter parsing, or markdown-to-HTML plumbing beyond mapping sections to this structure. Keep existing behavior for superseded banners and links. Match the reference exactly on spacing and color by using the provided classes rather than inventing new CSS.
