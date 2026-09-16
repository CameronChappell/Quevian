# Homepage product demo — production brief

Status: player prepared; video generation is blocked because the installed Higgsfield plugin exposes no callable generation tools in this conversation. No clip has been generated or substituted, and the homepage keeps its existing preview until reviewed media is configured.

## Higgsfield brief

Create one silent, 15–20 second, 16:9 product walkthrough for Quevian’s homepage. Target 1920×1080 H.264 MP4 with web/fast-start encoding and no audio track. Keep the final file below 15 MB for fast loading and compatibility with both current hosts.

Use actual rendered Quevian screens containing fictional records as the reference footage. Preserve the interface, logo, typography, labels, and button positions. Do not invent controls, transform lettering, expose real customer data, or portray unfinished integrations as working. Prefer Higgsfield’s video-editing or motion-graphics workflow over generative reconstruction of interface text when those capabilities are available.

Sequence:

1. **0–3s:** Establish the ticket workspace and a short queue of fictional requests. White surfaces, black buttons, Inter, and the current monochrome Quevian logo.
2. **3–7s:** Open New ticket and create “New employee account setup” on the Help Desk board for a fictional company. Use a deliberate cursor and readable transitions.
3. **7–11s:** Open the created ticket, assign a teammate, and change its status to In Progress.
4. **11–16s:** Show a public portal update, then return to the queue with the updated ticket visible. Do not depict external email delivery.
5. **16–20s:** Hold the queue and ease back into the opening composition for a clean loop.

Avoid presenters, voiceover, decorative 3D scenes, new branding, large title cards, rapid zooms, and flashy transitions. Keep the product in use as the focus. Use only fictional data and the user's product assets as external references.

## Player and activation

`components/marketing/product-demo.tsx` provides muted, inline, looping playback, a visible pause/play control, viewport/background pausing, reduced-motion handling, and the existing product preview as a media-error fallback. No unavailable video URL is requested while `src` is null.

After generation and visual review:

- Copy the final clip to `public/media/quevian-product-demo.mp4` and a matching first-frame image to `public/media/quevian-product-demo-poster.jpg`.
- Set `productDemoMedia.src` to `/media/quevian-product-demo.mp4` and `poster` to `/media/quevian-product-demo-poster.jpg` in `components/marketing/product-demo-media.ts`.
- GitHub Pages rewrites these paths with its deployment base; Sites uses the root paths.
- Check the actual clip for readable text, correct product behavior, smooth looping, and no private data. Test autoplay, pause, reduced motion, and the file-error fallback. Browser settings can still block autoplay; the Play demo control remains available.
- Build both the full app and GitHub Pages, push the media and source to both repositories, and publish the completed replacement.
