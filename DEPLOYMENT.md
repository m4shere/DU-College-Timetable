# Update an existing deployment safely

1. Download a backup from the live app if you have important timetable data in that browser. Also download/export the GitHub repository's current contents.
2. Replace the website's root files with this project's files. Keep `index.html` at the published root and include the `palettes/` and `assets/` folders.
3. Keep `contact-config.js` or edit its values before publishing. Do not delete it; it contains your public email and social URLs.
4. Commit and push the whole project, not only `index.html`. `sw.js` includes every current palette file in its cache list.
5. Open the live site, hard refresh it once if the old layout remains, then test: open an existing timetable, change its palette, edit a class from the pencil, add a class from a plus, add more than one teacher to a lab, export/import JSON, open Preview, and Save PDF.
6. If the browser still shows an old version, close and reopen the site or clear only this site's cached files/service worker. Do not clear site storage before exporting JSON.

The website does not sync saved data across devices. A JSON backup is the transferable editable copy; the PDF is a view-only copy.
