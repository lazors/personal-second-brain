# Confluence Routine Format

This document defines the **canonical format** a routine must use when stored in
Confluence so that this app can fetch and parse it.

We (this app) define the format. The third-party app that writes routines into
Confluence is expected to conform to it.

## Data flow

```
Third-party app ──writes──► Confluence ──fetched──► This app
   (producer)          (child pages under         (your local additions
                        a designated parent)        stay here, never written back)
```

- **Confluence is read-only source.** This app pulls routines from it.
- **Your additions stay local.** Anything you add on top of a fetched routine
  lives only in this app and is never pushed back to Confluence.

## Page layout

- Pick **one parent page** in Confluence to hold all routines.
- **Each child page under that parent = one routine.**
- Each child page must contain **exactly one** fenced code block tagged
  `second-brain-routine`, containing the canonical JSON (see below).
- The page may also render a human-readable table for eyeballing — but this app
  **only trusts the `second-brain-routine` JSON block**.

## Canonical JSON block

The producer writes a fenced code block (Confluence "Code Block" macro) whose
content is a single JSON object:

````
```second-brain-routine
{
  "name": "Working Routine",
  "description": "Daily working rhythm",
  "steps": [
    { "id": "wake",     "step": "Wake + water", "time": "06:30", "freq": "daily",    "notes": "500ml" },
    { "id": "standup",  "step": "Standup",      "time": "09:00", "freq": "weekdays", "notes": "team sync" },
    { "id": "deepwork", "step": "Deep work",    "time": null,    "freq": "daily",    "notes": "90 min block" },
    { "id": "review",   "step": "Review inbox", "time": null,    "freq": "daily",    "notes": "zero it out" }
  ]
}
```
````

## Field reference

### Routine (top-level object)

| Field         | Type            | Required | Notes                                                        |
|---------------|-----------------|----------|--------------------------------------------------------------|
| `name`        | string          | no       | Routine name. Falls back to the Confluence page title.       |
| `description` | string          | no       | Short description of the routine.                            |
| `steps`       | array of Step   | yes      | Ordered list of steps. Order on disk = display order.        |

### Step (object inside `steps`)

| Field   | Type             | Required | Notes                                                                 |
|---------|------------------|----------|-----------------------------------------------------------------------|
| `step`  | string           | yes      | The activity text.                                                    |
| `id`    | string           | no       | Stable identifier. If omitted, the app generates one. Used to anchor your local additions to a step even if the producer rewrites the list. |
| `time`  | string or `null` | no       | `"HH:MM"` 24-hour. `null` or omitted = **untimed checklist step**. A value = **timed step**. |
| `freq`  | string           | no       | Frequency. Recommended values: `daily`, `weekdays`, `weekends`, `weekly`, or a day pattern like `Mon/Wed/Fri`. Omitted = `daily`. |
| `notes` | string           | no       | Free-text notes.                                                     |

## Parsing rules (what this app guarantees)

1. Read every child page under the configured parent page.
2. On each page, find the **first** ` ```second-brain-routine ` code block. If
   none exists, the page is ignored (not a routine).
3. Parse its content as JSON. Invalid JSON → the page is skipped and reported.
4. `name` defaults to the page title when absent.
5. Each step with no `id` gets a generated, stable id.
6. A step with a `time` is **timed**; without one it is an **untimed checklist
   step**. This is how a single routine mixes scheduled and checklist items.
7. `freq` defaults to `daily` when absent.

## Minimal valid example

A routine page only strictly needs a name (or page title) and one step:

````
```second-brain-routine
{
  "name": "Quick Routine",
  "steps": [
    { "step": "Stretch" }
  ]
}
```
````
