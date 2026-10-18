# DU College Timetable Builder

A mobile-first timetable builder for college students. Add your subjects and teachers once, schedule classes from dropdowns, choose a coordinated mood-based theme, and manage important reminders. This is a static website with no account or backend.

## Features

- **Quick class entry:** choose a saved subject, one or more teachers, day, time, duration and room. Full names and notes are optional.
- **Reusable subject library:** keep subject abbreviations and optional full subject names. A subject can have several teachers, including labs shared by teachers.
- **12 mood-based palettes:** Cute & Muted, Retro Pop, Vintage Paper, Soft Academia, Pastel Dream, Dark Academia, Y2K, Minimal Neutral, Botanical, Ocean Calm, Citrus Club and Monochrome Red.
- **Modular palettes:** each palette is a JSON file in `palettes/`. Add a palette by creating another JSON file and adding its entry to `palettes/manifest.json`.
- **Automatic recoloring:** selecting another theme recolors automatically themed classes already on the timetable. Manually chosen custom subject/class colors remain unchanged.
- **Timetable editing:** edit a class with the pencil on its tile or add from an empty time slot/day plus button. Consecutive periods support long lectures and labs.
- **Flexible times:** select start time, period length and number of periods. There are no redundant custom slot names.
- **Save/share actions near the schedule:** local autosave, JSON backup/import, share the website, screenshot preview and print/save PDF.
- **Reminders:** tests, assignments, practical files, presentations and other dated tasks.
- **Offline support:** a service worker caches the static app after it has loaded successfully online.
- **Data compatibility:** reads the existing `duCollegeTimetableBuilder.v2` local-storage key and current v2 backup structure, then adds a reusable subject/teacher library.

## Open locally

Because palettes are loaded from individual JSON files, don't open `index.html` directly as a `file://` URL. Use a simple local web server, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Deploy the full project

Upload the contents of this folder to the same website root used by the existing site. Keep `index.html` at the root and preserve the `palettes/` and `assets/` folders. This version has no build step or package installation.

**Important for an existing live site:** back up your GitHub repository first. Deploy all files together, especially `app.js`, `styles.css`, `palette-loader.js`, `palettes/manifest.json`, every palette JSON file and `sw.js`. The service-worker cache has a new version so it can replace the previous app shell.

The current published `contact-config.js` values have been retained. Replace them if needed before publishing.

## Add a palette

1. Copy an existing JSON file from `palettes/` and give it a new filename, e.g. `soft-lilac.json`.
2. Edit `id`, `name`, `mood`, `interface` and `categories`.
3. Add one matching entry to `palettes/manifest.json`.
4. Add the new JSON path to the `CORE_ASSETS` list in `sw.js` so the new palette is available offline, then deploy.

Palette JSON format:

```json
{
  "id": "soft-lilac",
  "name": "Soft Lilac",
  "mood": "calm, cloudy and gentle",
  "interface": {
    "page": "#F5F2FB",
    "surface": "#FFFFFF",
    "surfaceAlt": "#EAE4F5",
    "ink": "#2E293B",
    "muted": "#716A80",
    "line": "#D9D0EA",
    "accent": "#9B83D5",
    "accentInk": "#241A3A",
    "header": "#302842",
    "headerInk": "#FFFFFF",
    "highlight": "#E8C6E8"
  },
  "categories": {
    "Core": "#D7C8F4",
    "Lecture": "#BFD8F4",
    "Tutorial": "#F4D0D7",
    "Lab": "#C5E5D8",
    "GE": "#F4D9AB",
    "AEC": "#C7D9E7",
    "SEC": "#E4C5E9",
    "DSE": "#D4D0FA",
    "VAC": "#B7E2E7",
    "Practical": "#E6D7C6",
    "Other": "#E9E7F0"
  }
}
```

Keep names and category labels exactly as above, and use six-digit hex colors. The theme colors affect the interface and automatic subject/category fills. Students' manual subject or class overrides are not overwritten by a theme change.

## Saving, privacy and backups

- Timetable data, subjects, teachers, selected palette and reminders are stored in the browser's local storage. They are not uploaded to this project or synced between devices.
- **Save backup** downloads a `.json` backup that can be imported later on another device.
- **Save PDF** produces a print-oriented timetable with color preservation enabled. In the print dialog, enable background graphics if your browser has that setting.
- A screenshot preview hides editing controls and is arranged for capturing/sharing the timetable.
- Reminders are shown when the page is opened. This static version does not send push notifications after the page is closed.

## Files

- `index.html` — app structure, schedule, tabs and dialogs
- `styles.css` — responsive interface, mobile schedule, preview and print styles
- `app.js` — data model, migration, rendering, editing, reminders, backup and sharing
- `palette-loader.js` — reads the palette manifest and palette JSON files
- `palettes/manifest.json` — list of available palettes
- `palettes/*.json` — one file per palette
- `contact-config.js` — creator email and social links
- `assets/` — app logo and replaceable contact icons
- `manifest.webmanifest` and `sw.js` — install/offline support

## Existing user data

The app keeps the previous `duCollegeTimetableBuilder.v2` storage key and reads the existing class/reminder fields. On the same origin and browser, the updated app should migrate the old data into its new subject library automatically. Still, download a JSON backup before deploying. Browser storage is origin-specific and cannot move from a local test URL to the production URL by itself.

## Feedback

Open a GitHub issue or use the contact links configured in `contact-config.js`. Don't attach a private timetable backup to a public issue.


## Replaceable icons and lecture/lab classes

See [`assets/icons/README.md`](assets/icons/README.md) for the icon filename map. Replace any icon SVG in that folder with your preferred SVG using the same filename. Subjects are stored separately from class sessions: select a subject once, then choose Lecture, Tutorial, Lab / Practical, or Other for each scheduled class. This allows a single Physics subject to have both lectures and labs with their own teacher selections, times, and rooms. See [`ICON-AND-CLASS-CHANGES.md`](ICON-AND-CLASS-CHANGES.md) before deploying.
