<!--
Setup snippet for the wherefore plugin.

Paste the block below (everything between the markers) into your project's
CLAUDE.md, once per repo. It makes Claude OFFER to capture decisions as they
happen, so logging becomes a "yes" rather than a chore someone has to remember.
CLAUDE.md is loaded as context every session, so no invocation needed.

Keep it phrased as a project convention (as written). Don't restyle it as a
system directive -- that can trip prompt-injection defenses and get the text
surfaced to you instead of treated as context.
-->

<!-- ===== paste from here ===== -->

## Wherefore

This repo keeps a decision log in `wherefore/`, managed by the wherefore plugin. When a
working session reaches a decision worth keeping (an approach chosen, a tradeoff
resolved, an alternative rejected), offer to capture it: ask "Want me to add
this to the wherefore log?" and, if yes, use the `capture` skill. Only log actual
decisions and their rationale, not routine edits or unresolved back-and-forth.
To recall why something was built a certain way, use the `ask` skill.

<!-- ===== to here ===== -->
