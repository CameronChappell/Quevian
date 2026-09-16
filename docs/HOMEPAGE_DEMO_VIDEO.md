# Homepage product demo

The homepage uses a 20-second silent video rendered through Higgsfield's native Higgsedit editor on September 16, 2026. The Product page retains its interactive preview.

## Content and provenance

The seven source captures in `docs/demo/source/` show the actual Quevian React components with fictional, in-memory data. They contain no production customer records, credentials, or live messages. The local capture fixture never contacts a production API.

The walkthrough opens the queue, creates a ticket, changes its status to In Progress, assigns Jordan Lee, posts a customer-portal update, and returns to the queue. Cursor motion and transitions are authored in Higgsedit. The interface lettering and logo are captured pixels, not generated substitutes. External email delivery is not depicted.

- Composition: `docs/demo/edit.jsx`
- Reviewed contact sheet: `docs/demo/review.jpg`
- MP4: `public/media/quevian-product-demo.mp4`
- Poster: `public/media/quevian-product-demo-poster.jpg`
- Encoding: H.264, 1280×720, 30 fps, 20 seconds, 796,650 bytes, no audio stream, fast-start metadata. The native Higgsfield master was compressed with H.264 CRF 23 for web delivery.
- Higgsfield video media ID: `61d32e1e-1f29-4390-9742-9b56db2d7ab0`
- Higgsfield editable-project archive media ID: `61e8bdfc-70aa-4047-9ac6-4f0e74dd8199`

## Playback

The homepage player is muted, loops, plays inline on mobile, and has a visible Play/Pause button. It pauses offscreen and when the page is hidden. Reduced-motion preferences suppress automatic playback; users can start it manually. A failed media load restores the existing preview. Both hosting builds serve their own copy of the video, with the GitHub Pages base path applied automatically.

## Reproduce the footage

1. Run `node tests/support/build-demo-fixture.mjs` for a temporary local-only capture fixture. Open `/__audit__/demo-capture.html` in the development preview. The iframe is 1280×720.
2. Create the fictional ticket and capture the visible UI states. `/__audit__/demo-followup.html` restores the assigned-ticket scene for the customer reply. The HTTP-only random UUID shim is confined to this fixture.
3. Move or remove `public/__audit__` before building. The production build refuses to run while that temporary directory exists.
4. In Higgsfield's sandbox, crop each stored source image to the iframe bounds with `ffmpeg -i INPUT.jpg -vf crop=1280:720:0:0 -frames:v 1 frames/NAME.png`.
5. Run `higgsedit build edit.jsx` from a directory containing the `frames/` folder. The script creates the native `quevian-demo` project and renders `quevian-demo/renders/demo-master.mp4`.
6. Encode the web copy with `ffmpeg -i quevian-demo/renders/demo-master.mp4 -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart quevian-product-demo.mp4`. Review frames and playback before replacing the production media.

Keep the source captures, composition, reviewed media, and application changes in GitHub together. Never publish the generated capture fixture.

## Verification

The finished clip was inspected with a contact sheet. In the browser preview, desktop and mobile playback started automatically while muted; the desktop pause/resume controls worked, and the mobile layout had no horizontal overflow.
