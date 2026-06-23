<!--
Setup snippet for the discussion-log plugin.

Paste the block below (everything between the markers) into your project's
CLAUDE.md, once per repo. It makes Claude OFFER to log decisions as they happen,
so capturing a discussion becomes a "yes" rather than a chore someone has to
remember. CLAUDE.md is loaded as context every session, so no invocation needed.

Keep it phrased as a project convention (as written). Don't restyle it as a
system directive — that can trip prompt-injection defenses and get the text
surfaced to you instead of treated as context.
-->

<!-- ===== paste from here ===== -->

## Discussion log

This repo keeps a discussion log in `discussions/`, managed by the
discussion-log plugin. When a working session reaches a decision worth
keeping — an approach chosen, a tradeoff resolved, an alternative rejected —
offer to capture it: ask "Want me to add this to the discussion log?" and, if
yes, use the `discussion-log` skill. Only log actual decisions and their
rationale, not routine edits or unresolved back-and-forth. To recall why
something was built a certain way, use the `discussion-read` skill.

<!-- ===== to here ===== -->
