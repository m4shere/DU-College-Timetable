# DU College Timetable Builder

A static, mobile-friendly timetable builder intended for DU students. It supports custom college times, multi-slot labs, course-category colour palettes, full class details, dated reminders, local auto-save and JSON backups.

## Preview locally

Open `index.html` in a modern browser. Most functions work locally, but installable/offline service-worker features require an HTTPS website or localhost.

## Publish with Cloudflare Pages

1. Upload the contents of this folder (not the parent folder itself) to a new Cloudflare Pages direct-upload project, or connect a Git repository containing these files.
2. The deployed root must contain `index.html`, `styles.css`, `app.js`, `palettes.js`, `contact-config.js`, `manifest.webmanifest`, and `sw.js`. Keep the `assets` folder next to them.
3. After deployment, test creating classes/reminders, export a JSON backup, and import that backup in another browser.
4. Add a custom domain/subdomain under the Pages project's Custom domains settings if desired.

GitHub Pages also works; publish this folder's contents from the repository root or `/docs`.

## Add your logo

Replace `assets/logo.svg` with your own logo SVG using the same filename. If using PNG/JPG instead, update the logo paths in `index.html` and the app shell list in `sw.js`. SVG gives the cleanest result on high-density phone screens.

## Add your contact links

Edit `contact-config.js`:

```js
window.DU_CONTACTS = {
  email: "your-real-email@example.com",
  instagram: "your_instagram_handle",
  reddit: "your_reddit_username"
};
```

Instagram/Reddit fields accept handles or full profile URLs. Leave a field blank to show it as unconfigured.

## Data and privacy: important

- Timetable classes, settings, palette and reminders are automatically saved in the current browser's local storage on that device/origin.
- This static version does **not** upload personal timetable data to a server, create accounts, or sync across devices.
- Clearing browser storage, using a different browser/device, or some private browsing sessions can make local data unavailable.
- Use **Download backup** after important changes. The `.json` backup includes class details, settings, selected palette and reminders. Store it in a safe folder/Drive or send it through WhatsApp. On another device, open the same published website and choose **Import backup**, then select that JSON file.
- A PDF is for viewing/printing; JSON is the editable backup.
- The service worker caches the website shell for subsequent offline opening after a successful first load on HTTPS, but offline caching is not cloud sync and does not replace backups.
- Reminders appear in the site when opened, but the current version does not send push notifications while the site is closed.

## Editing palettes

Edit `palettes.js`. Each palette maps course categories (`Core`, `Lecture`, `Tutorial`, `Lab`, `GE`, `AEC`, `SEC`, `DSE`, `VAC`, `Practical`, `Other`) to pastel hex colours. The app UI uses a separate neutral theme; changing a course palette only changes the class/legend colours.

## Project files

- `index.html` — page structure
- `styles.css` — layout, compact mobile UI, theme styling
- `app.js` — timetable editing, local storage, reminders, backup/import, rendering
- `palettes.js` — soft course-type colour palettes
- `contact-config.js` — creator contact links
- `assets/logo.svg` — replaceable product logo slot
- `manifest.webmanifest` and `sw.js` — basic install/offline support

## Troubleshooting contact links

- The email link uses `mailto:`. It opens the visitor's default email app; it cannot send email directly from the website. If no email app is configured on the device, the link may appear to do nothing. The visitor can copy the address and use Gmail or another provider manually.
- After changing `contact-config.js`, redeploy the full project folder. The service-worker cache was bumped in this update; if an old version persists, close/reopen the site or clear the site's cached data.
- Email should be a plain address, e.g. `hello@example.com`, without quotes inside the value and without `mailto:`.
