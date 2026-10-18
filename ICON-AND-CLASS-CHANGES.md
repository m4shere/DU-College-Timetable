# Update notes: replaceable icons and class types

## Icons
All replaceable icon assets are in `assets/icons/`. Open `assets/icons/README.md` for the filename map. Replace any SVG with a new file of the same name. The set uses `currentColor` and a 24x24 viewBox.

## Subject vs class type
A subject is registered once (e.g. Physics). When scheduling it, select a **Class type** (Lecture, Tutorial, Lab / Practical, Other). This allows Physics lecture and Physics lab sessions to use the same subject record while each scheduled class retains its own day, time, room and selected teachers. Older saved classes without a `classType` are treated as Lecture.

## Existing data
The app continues using `duCollegeTimetableBuilder.v2` and normalizes older classes. Deploy to the same site origin to keep browser-local data available. Always export a JSON backup before replacing files.

## Deploy
Replace the project files on the existing GitHub repository and let the current Cloudflare Pages/Workers deployment flow run. Do not delete `contact-config.js`, `palettes/`, `palette-loader.js`, `sw.js`, `manifest.webmanifest`, or the existing `app.js` / `styles.css`. Upload the full folder, not just `index.html`.
