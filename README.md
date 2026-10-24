# nosave

**A Chrome extension that removes the Save button Google Images puts over a picture, so a click on the picture opens it.**

When you are signed in to Google, hovering over a picture in Google Images shows a
**Save** button in its top-right corner (**Uložit**, **Speichern**, **Enregistrer**… in
other languages). Clicking anywhere near that corner adds the picture to your saved
collection instead of opening it. nosave hides that button, and the **Saved ▾** button
that replaces it on pictures you have already saved. The rest of the page,
including the **Save** button in the preview panel that opens beside the results, stays
as it is.

nosave is an independent extension, not made by or affiliated with Google.

## Install

1. Download this repository: **Code → Download ZIP**, then unzip it (or `git clone` it).
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Choose **Load unpacked** and select the unzipped `nosave` folder.

It also works in other Chromium browsers that load unpacked extensions (Edge, Brave,
Vivaldi, Opera).

## Use

There is nothing to set up. Search Google Images as usual: hovering over a picture no
longer shows the Save button, and clicking the picture anywhere opens it in the preview
panel.

To save a picture to your collection, or to remove one, open it and use **Save** in the
preview panel.

To turn nosave off for a while, switch it off in `chrome://extensions`; switch it back on
and reload the results page.

## What it touches

- It runs only on Google search result pages (`https://www.google.<country>/search?…`),
  on every Google country domain.
- It reads the page's buttons and hides the hover Save and Saved buttons. It does not
  remove them, click anything, or change any other part of the page.
- It asks for no permissions, stores nothing, and makes no network requests. There is no
  server, account or analytics.

## Limits

- The button is recognised by its text (the word "Save" in the page's language), its
  label (that word followed by the picture's title) and its place on a picture. If Google
  renames or reshapes it, the button can come back until nosave is updated.
- The word list covers the common Google interface languages. If the button still shows
  in your language, open an issue with the word it shows.
- It does nothing in the Google app, on mobile, or on other search engines.

## Licence

[MIT](LICENSE)
