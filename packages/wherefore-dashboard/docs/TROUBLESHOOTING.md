# Troubleshooting

## YAMLException: bad indentation of a mapping entry

**Symptom**

```
YAMLException: bad indentation of a mapping entry
  title: Some title: with a colon
  -------------------^
```

**Cause**

An unquoted colon in a `title:` value makes YAML interpret the text after the colon as a nested mapping key, which is illegal at that indent level.

**Fix**

Always quote the title value:

```yaml
# bad
title: Early-stop pagination: QPM ceiling and timeout cliff only

# good
title: "Early-stop pagination: QPM ceiling and timeout cliff only"
```

The `capture` skill template now shows titles always quoted, guarding against colons, `#` comment markers, `[` / `{` flow indicators, and other YAML special characters that can appear in free-form titles.

---

## Duplicate id warnings from glob-loader

**Symptom**

```
[WARN] [glob-loader] Duplicate id "q-001" found in .../wherefore/questions/Q-001.md.
```

**Cause**

Astro's glob loader uses the `id` field from frontmatter as the collection entry id (lowercased). An earlier version of the questions schema also declared `id` as a data field, causing the loader to register the same id twice for each file.

**Fix** (already applied in dashboard v0.x)

The `id` field was removed from the questions Zod schema in `content.config.ts`. The `questions.astro` page now reads the question id via `q.id.toUpperCase()` (the Astro entry id) rather than `q.data.id`. No change is required to question files — `id:` in frontmatter continues to drive the entry id correctly.
