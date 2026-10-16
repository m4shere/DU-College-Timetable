# DU College Timetable Builder

A mobile-friendly timetable builder designed for University of Delhi (DU) students. Create a timetable that fits your college's schedule, customize the colours, and keep track of tests, assignments, and practical-file deadlines.

> **Live demo:** Add your deployed website URL here.  
> **Suggestions and bug reports:** Open a GitHub Issue or use the creator contact links on the website.

## Features

- **Designed for mobile:** Quickly check the subject, room, teacher short form, and class category.
- **Flexible schedules:** Configure the college's start time, slot length, and number of time slots. Supports morning, winter-shift, and evening schedules.
- **Long classes and labs:** Classes can span multiple consecutive time slots.
- **Useful class details:** Display a short subject code, room number, teacher abbreviation, and category; keep full subject/teacher details and extra notes available when opening or hovering over a class.
- **Soft colour palettes:** Choose a palette for course categories, or customize class colours.
- **Reminders:** Add dates, times, subjects, and notes for tests, assignment submissions, and practical files.
- **Backup and restore:** Export your timetable and reminders to a JSON file and import that file later.
- **Print-friendly:** Print or save a timetable as a PDF to share with classmates.
- **Install/offline support:** The site includes a web app manifest and service worker for supported browsers after the site has loaded online.

## Getting started

1. Open the deployed website, or download/clone this repository.
2. If running locally, open `index.html` in a modern browser. Some install/offline features require HTTPS or `localhost`.
3. Set your college information, semester, and class timings.
4. Add your subjects, room numbers, teacher details, categories, and class durations.
5. Add reminders for important dates.
6. Use **Download backup** after making important changes. To restore your data, open the site and use **Import backup** to select the saved JSON file.

## Save and protect your timetable

This version stores timetable settings, classes, selected colours, and reminders in the browser on the current device. It does **not** upload your timetable to a server or sync it automatically between devices.

- Export a JSON backup regularly, especially before changing devices or clearing browser data.
- Keep the backup somewhere safe, such as your Files app or cloud drive.
- To move your timetable to another device, open the same website there and import the JSON backup.
- A PDF is useful for viewing and printing; a JSON file is the editable backup.
- Reminders are shown when you open the website. This version does not send push notifications while the site is closed.

## Privacy

The static version is designed to keep timetable data in the user's browser. It does not require an account. Avoid adding sensitive personal information to class notes or reminders, especially on shared devices.

## Run or host the project

The project is a static website and does not require a build step.

### Run locally

Download or clone the repository and open `index.html`. For service-worker testing, run it from `localhost` or use an HTTPS deployment.

### Deploy

You can host the repository on a static hosting service such as GitHub Pages or Cloudflare Pages. Keep the project files and `assets` folder together, and make sure `index.html` is at the published site root (or the configured publishing directory).

## Customize the project

- `index.html` — page structure and app shell
- `styles.css` — layout, mobile styles, and visual design
- `app.js` — timetable editing, reminders, rendering, and backup/import
- `palettes.js` — course-category colour palettes
- `contact-config.js` — creator email and social profile links
- `assets/logo.svg` — replaceable logo
- `manifest.webmanifest` and `sw.js` — install/offline support

### Add your logo

Replace `assets/logo.svg` with your own SVG logo, keeping the same filename. If you use a PNG or JPG instead, update the image references in `index.html` and the cached asset list in `sw.js`.

### Set creator contact links

Edit `contact-config.js` and enter your own details. Use a plain email address for the email field; use a social handle or full profile URL for Instagram and Reddit. Do not commit private contact information unless you intend it to be public.

## Contributing

Suggestions, accessibility improvements, bug reports, and pull requests are welcome. When reporting a bug, include:

- What you expected to happen
- What actually happened
- Your device and browser
- Steps to reproduce the issue

Please do not include private timetable backups or personal information in public issues.

## License

No license has been specified yet. Unless a license is added to this repository, reuse and redistribution are not automatically granted. Add a license file if you want to define how others may use, modify, and share the project.
