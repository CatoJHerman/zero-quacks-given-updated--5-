# Verification report

## Passed

- `npm install` completed and `npm run dev` started Vite on `http://127.0.0.1:5173/`.
- `npm test`: six logic tests and five React DOM interaction tests passed.
- Previous and next adjacent targets, exclusion of the active/already altered word, and an empty eligible set were tested.
- The first mutation after two completed words, unchanged typed input, Backspace before sabotage, Backspace at the beginning after sabotage, full round score, restart, and timer cleanup after completion were tested through the React DOM.
- Adaptive cooldown rates were tested for steady, fast, slow, and idle typing. A DOM timer test verifies no second substitution during the first two seconds after a change, followed by a later substitution.
- Rendered line grouping and the four substitutions per line cap were tested, including the skip case when both adjacent lines are full.
- The staged duck approach, impact-time substitution, stale-target cancellation, sound-enabled result clip, hamster element, and confetti elements were checked in React DOM tests. The bundled audio files decode through FFprobe, and the hamster WebP was checked with Pillow as a 169-frame RGBA animation.
- The supplied game song was trimmed by 1.5 seconds. The scorecard music, game music switching, top-left logo, and scorecard music stop on restart were checked in React DOM tests. Audio decoding was checked with FFprobe, but listening in a live browser remains unverified.
- `npm run build` completed successfully.

## Not visually verified

- A 1366 × 768 and narrow mobile browser screenshot was not available: the cloud browser could not connect to the workspace's local server (`ERR_CONNECTION_REFUSED`). CSS has desktop, tablet, mobile, and reduced-motion rules, but those visual layouts were not inspected in a browser.
- The duck approach, splash, confetti, hamster animation, and audio playback were not watched or heard in a live browser. Their React state transitions and media files were checked without a visual browser session.
- WebGL/model fallback is unnecessary in this version: the game uses CSS and inline SVG and never loads the retained GLB file.
