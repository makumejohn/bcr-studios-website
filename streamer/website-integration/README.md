# BCR Studios homepage link

This patch is designed for the current `makumejohn/bcr-studios-website` `index.html` that was inspected during preparation. It adds a BCR Streamer navigation link and connects the existing music-card CTA to the streamer.

Before applying the patch, replace every `https://YOUR-BCR-STREAMER-HOST` with the full URL given by the Node.js hosting provider after the app is deployed. Keep the current root `index.html`, `style.css`, and `script.js` otherwise unchanged.

Apply from the repository root with a Git client/terminal using `git apply website-integration/add-streamer-link.patch` only after placing this patch in the repo root (or copy the two changed HTML lines directly in GitHub's editor). Check the diff before committing.
