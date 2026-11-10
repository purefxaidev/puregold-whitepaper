# PureGold PWA icons

All home-screen, maskable, and iPhone startup images are built from **one** logo file.

1. Add the official square logo as `icons/source.png` (1024×1024 PNG is ideal).
   If that file is missing, the builder falls back to `icon.png`.
2. Run `python3 scripts/build_pwa_icons.py`.
3. Commit the updated files in this folder.

`manifest.webmanifest` and the landing page already point here, so you do not need to edit paths when the logo changes.
