# Homepage product demo

The homepage uses a silent 20-second, 60 fps video rendered with Higgsfield's native Higgsedit editor. The Product page retains its interactive preview.

## Content and provenance

The source captures in `docs/demo/source/` show the actual Quevian React components with fictional, in-memory data. They contain no production customer records, credentials, or live messages. The capture fixture intercepts every request and never contacts a production API.

The walkthrough opens the queue, creates a ticket, changes its status to In Progress, assigns Jordan Lee, posts a customer-portal update, and returns to the queue. Interface lettering and the logo are captured pixels. External email delivery is not depicted.

- Composition: `docs/demo/edit.jsx`
- Reviewed contact sheet: `docs/demo/review.jpg`
- MP4: `public/media/quevian-product-demo.mp4`
- Poster: `public/media/quevian-product-demo-poster.jpg`
- Encoding: H.264, 1280×720, 60 fps, 20 seconds, no audio, fast-start metadata; CRF 23 web export.
- Final Higgsfield video media ID: `7c89f84c-624d-4315-9842-fc06e77f7808`
- Editable-project archive media ID: `80aaecef-72a3-408a-9ba9-c35cfde68be6`

## Motion

One continuous cursor track replaces the previous per-scene cursor resets. Eased 0.36–0.65-second dissolves connect the states. Small 4.5–9% zooms use compensated offsets to focus on each action without cropping the lower buttons. Camera and cursor positions return to their opening values before the loop repeats.

## Homepage presentation

The video sits in a rounded frame with a diffuse neutral gray halo on all sides. There is no caption strip, separate pause button, or native controls bar.

The video is muted, loops, and plays inline on mobile. It pauses offscreen and when the page is hidden. Reduced-motion preferences suppress automatic playback. Clicking the video or pressing Space/Enter while it is focused toggles playback; its accessible label describes the current action. Failed media loading restores the existing product preview. Both builds serve their own video, and the GitHub Pages base path is applied automatically. The revision query in `product-demo-media.ts` refreshes previously cached assets.

## Reproduction

1. Run `node tests/support/build-demo-fixture.mjs` for the temporary local capture fixture. Source scenes use a 1280×720 iframe.
2. Capture the fictional workflow states. Remove `public/__audit__` before publishing; the production build refuses to run while it exists.
3. Crop stored screenshots with `ffmpeg -i INPUT.jpg -vf crop=1280:720:0:0 -frames:v 1 frames/NAME.png`.
4. Run `higgsedit build edit.jsx` beside the `frames/` folder. This creates `quevian-demo/` with editable native tracks, review PNGs, and the master.
5. Encode with `ffmpeg -i quevian-demo/renders/demo-master.mp4 -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart quevian-product-demo.mp4`.
6. Inspect the review frames, decode the full clip, and check the opening/ending frames before replacing the published media.

Keep the composition, source captures, reviewed assets, and application changes in GitHub. Do not publish temporary capture fixtures.
