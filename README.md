# PUREGOLD landing + whitepaper

Public site for **PureGold by PureFxAi**.

- Custom domain: **https://gold.purefxai.store/**
- GitHub Pages fallback: https://purefxaidev.github.io/puregold-whitepaper/
- App repository: https://github.com/purefxaidev/puregold-app
- Latest APK: [`downloads/PUREGOLD-0.9.2.apk`](downloads/PUREGOLD-0.9.2.apk) (also `downloads/PUREGOLD.apk`)

The page shows a cinematic hero (น้องหมี), live XAU / Thai gold / bias / chart / news (gold-dashboard + public quotes), TH+EN version history, Exness IB, donate, and a risk disclaimer.

## GoDaddy DNS (same pattern as call.purefxai.store)

On the **purefxai.store** domain in GoDaddy DNS:

| Type  | Name | Value                 | TTL    |
| ----- | ---- | --------------------- | ------ |
| CNAME | `gold` | `purefxaidev.github.io` | 600 or default |

Do **not** use A records unless this were an apex (`purefxai.store`). `gold` is a subdomain, so CNAME is correct — same as `call` → `purefxaidev.github.io`.

Then in GitHub: **puregold-whitepaper → Settings → Pages → Custom domain** = `gold.purefxai.store`. Wait until the DNS check passes, then enable **Enforce HTTPS**.

This repo already contains a root `CNAME` file with `gold.purefxai.store`. After DNS propagates, https://gold.purefxai.store/ serves this site. Until then use the github.io URL above.

Hero video: `assets/hero.webm` / `assets/hero.mp4` (looping น้องหมี motion). ComfyUI at `127.0.0.1:8188` was not reachable on the build box; replace these files later with the `videoPUREFXAI OMI_r2v` export if desired.
