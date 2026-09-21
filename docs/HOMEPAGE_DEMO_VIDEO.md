# Homepage product demo

The homepage uses a silent 20-second, 60 fps, 2560×1440 video. The Product page retains its interactive preview.

## Content and provenance

The source captures in `docs/demo/source/` show actual Quevian React components with fictional, in-memory data. They contain no production customer records, credentials, or live messages. The capture fixture intercepts every request and never contacts a production API. All addresses use the reserved `example.test` domain.

The walkthrough opens the queue, creates a ticket, changes its status to In Progress, assigns Jordan Lee, posts a customer-portal update, and returns to the queue. Interface lettering and the logo are captured pixels. External email delivery is not depicted.

- Native Higgsedit composition: `docs/demo/edit.jsx`
- Local renderer used for this revision: `docs/demo/render.py`
- Reviewed contact sheet: `docs/demo/review.jpg`
- MP4: `public/media/quevian-product-demo.mp4`
- Poster: `public/media/quevian-product-demo-poster.jpg`
- Encoding: H.264, 2560×1440, 60 fps, 20 seconds, no audio, fast-start metadata; a single CRF 16 encode.

Version 4 retains the high-density captures and removes all camera movement. It was rendered locally without uploading the source captures to a third-party rendering service. The native Higgsedit composition remains available for future editing; the shipped v4 file is the local renderer's output.

## Motion and clarity

The interface stays at its original size and position throughout the video: no zooming, panning, or camera animation. One continuous, eased cursor track follows the workflow. Direct state changes keep interface text from overlapping. The cursor returns to its opening position before the loop repeats. No motion blur or artificial sharpening is applied. Small solid background masks remove the browser capture cursor from blank regions before compositing the animated pointer.

## Homepage presentation

The video sits in a rounded frame with a diffuse neutral gray halo on all sides. There is no caption strip, separate pause button, or native controls bar.

The video is muted, loops, and plays inline on mobile. It pauses offscreen and when the page is hidden. Reduced-motion preferences suppress automatic playback. Clicking the video or pressing Space/Enter while focused toggles playback; its accessible label describes the current action. Failed media loading restores the existing product preview. Both builds serve their own video, and the GitHub Pages base path is applied automatically. The revision query in `product-demo-media.ts` refreshes previously cached assets.

## Reproduction

1. Run `node tests/support/build-demo-fixture.mjs` for the temporary local capture fixture.
2. Open `/__audit__/demo-hd-capture.html` in the managed preview. It renders a 1600×900 logical workspace at 2560×1440 pixels. Capture the fictional workflow states into `docs/demo/source/`.
3. Remove `public/__audit__` before publishing; the production build refuses to run while it exists.
4. Run `python docs/demo/render.py` with FFmpeg and Pillow installed. It renders the high-resolution sequence and decoded review frames into `docs/demo/renders/`.
5. Inspect the review frames, decode the full clip, and check the opening/ending frames before replacing the published media. Keep the generated intermediate render directory outside the committed source tree.

For the native Higgsedit project, run `higgsedit build edit.jsx` beside the `source/` folder. That path requires the native Higgsedit toolchain and produces an independently editable project.
