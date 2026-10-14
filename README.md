# Gallery — Phase 6

A runnable foundation for a Windows desktop gallery. The Node scanner discovers common image and video files and serves a unified chronological gallery. It avoids Windows/system/application/cache locations by default while including accessible local, removable, and network drives.

## Run

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. On Windows, the scanner automatically attempts every accessible lettered drive. During non-Windows development it scans the project folder so the app can run safely in preview.

## Optional scan roots

For development or a smaller scan, add `MEDIA_SCAN_ROOTS` through the workspace Secrets panel (see `.env.example`), with comma-separated paths. Do not create a `.env` file.

## Phase 2 scope

- Photo/video discovery: JPG/JPEG, PNG, GIF, BMP, WEBP, HEIC/HEIF, MP4, MOV, AVI, MKV, WMV
- Unified newest-first gallery using image capture date where embedded, otherwise file modified date
- Progressive results exposed while the initial scan runs, so discovered media is browseable immediately
- Background file watching after the initial scan: new, changed, moved (remove/add), and removed media automatically update the gallery
- Live scan/watcher state and file counts in the gallery header
- Default exclusion of Windows, application installation, system-volume, recycle-bin, package/cache, and hidden-dot folders during discovery
- Automatic Windows drive discovery via PowerShell for local, removable, and mapped network drives; each drive's type and connection state is shown in the footer
- Catalogued media on a disconnected drive remains visible with a **DRIVE OFFLINE** label and cannot be opened until its source reconnects
- Click any gallery tile to open a focused photo viewer or an in-browser video player
- Move an opened photo or video to an accessible folder by entering its folder path
- Delete an opened item with **Move to Recycle Bin**. When the server runs on Windows, the original file is sent to the Windows Recycle Bin instead of being permanently deleted.
- Video controls for pause, volume, seek, and fullscreen; keyboard ←/→ navigation between opened items and Esc to close

- Mark any photo or video as a favorite and browse the Favorites collection.
- Create virtual albums and add photos or videos to them from the media viewer. Album membership never relocates or copies original files.
- Remove media from an album without affecting the original file.

Favorites and albums are stored in this browser's localStorage (not a database), so they are local to the browser profile and can be cleared with browser site data. They survive server restarts but will not follow a different browser/device. Turn on the workspace Database button in a future build to persist collections centrally. Recycle Bin support requires the gallery server to run on Windows; non-Windows preview environments show a clear unavailable message and do not delete files. File-watch state and the scanned library are held in server memory; restarting the server restarts the scan and watcher.
