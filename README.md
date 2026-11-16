# LinkBoard

LinkBoard stores links you reuse and lets you insert one into a text field without switching tabs or copying and pasting manually. For example, keep frequently used URLs for support forms, project trackers, or shared documents.

## Install

1. Download or clone this repository.
2. In Chrome, open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Select **Load unpacked** and choose the repository folder.

## Use

1. Select the LinkBoard extension icon.
2. Add a link by entering its name and URL. You can also choose an icon and color.
3. To use a saved link, right-click an editable field on a webpage and choose it from the **LinkBoard** submenu. The URL is inserted at the cursor, replacing any selected text.
4. Open the extension popup to edit or delete saved links.

LinkBoard’s context menu is available on editable fields, such as text inputs and text areas. Links are stored using Chrome sync storage.

## Privacy

LinkBoard doesn't collect, transmit, or sell any data. Your saved links are stored with `chrome.storage.sync`, which Chrome syncs across your own signed-in browsers. LinkBoard only accesses a page when you choose a link from its context menu, and only to insert that link into the focused field.

## Project structure

```text
manifest.json     Extension manifest (Manifest V3)
background.js     Service worker: builds the context menu and inserts links
popup/            Toolbar popup for adding, editing, reordering, and deleting links
icons/            Extension icons (16, 48, 128 px)
```

## Package for the Chrome Web Store

Zip the extension files without repository metadata:

```powershell
Compress-Archive -Path manifest.json, background.js, popup, icons -DestinationPath LinkBoard.zip -Force
```
