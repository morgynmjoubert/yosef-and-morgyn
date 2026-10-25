# Yosef & Morgyn

Wedding website for December 28, 2026: schedule, Bocado dinner menu and RSVP form. Hosted on GitHub Pages.

## How RSVPs work

The form on `index.html` posts to a Google Apps Script web app (`apps-script/Code.gs`), which adds one row per RSVP to the **RSVPs** tab of a private Google Sheet. The sheet also shows the total attending next to the Bodega Room's 44-seat limit.

To connect a new sheet:

1. Create a Google Sheet, then open **Extensions > Apps Script**.
2. Replace the editor's contents with `apps-script/Code.gs` and save.
3. Choose the `setup` function and click **Run** (approve the permission prompt) to create the RSVPs tab.
4. **Deploy > New deployment > Web app**: Execute as **Me**, Who has access **Anyone**. Copy the URL ending in `/exec`.
5. Paste that URL into `RSVP_ENDPOINT` near the bottom of `index.html`.

If a guest submits twice, both rows appear; the later timestamp is their current answer.
