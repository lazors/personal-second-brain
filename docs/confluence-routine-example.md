# Working Routine

Example routine page. The third-party app writes a fenced `routine` block (inside
a Confluence Code Block macro) onto a child page under the routines parent page.
This app fetches the page and parses the block.

```routine
{
  "name": "Working Routine",
  "description": "Daily working rhythm",
  "steps": [
    { "id": "standup",   "step": "Team standup", "time": "09:00", "freq": "weekdays", "notes": "sync blockers" },
    { "id": "call-jon",  "step": "Call with Jon", "time": null,    "freq": "weekdays", "notes": "some notes" },
    { "id": "interview", "step": "Interview",     "time": null,    "freq": "weekdays", "notes": "2 hours, notes" }
  ]
}
```

## Fields

- `name` — routine name (falls back to the Confluence page title).
- `description` — optional short description.
- `steps[].id` — stable id; lets local additions stay attached to a step.
- `steps[].step` — the activity (required).
- `steps[].time` — `"HH:MM"` for a timed step, or `null` for an untimed checklist step.
- `steps[].freq` — `daily`, `weekdays`, `weekends`, `weekly`, etc. (defaults to `daily`).
- `steps[].notes` — free-text notes.
