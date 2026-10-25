# Zero Quacks Given

A self-contained React/Vite typing game in a cartoon pond. The water, scenery, and duck are layered CSS and inline SVG; the passage and input remain ordinary HTML. The original `public/models/duck.glb` is retained from the supplied project for future experiments, but this version has no WebGL requirement and runs without it.

## Run

Requires Node.js 20.19+ or 22.12+ and npm.

```bash
cd zero-quacks-given
npm install
npm run dev
```

Open the local URL Vite prints (normally `http://127.0.0.1:5173/`). To expose it to another device on the same network, run `npm run dev -- --host 0.0.0.0`.

```bash
npm test
npm run build
npm run preview
```

No remote fonts, images, APIs, or keys are used at runtime. The supplied local audio and a transparent animated WebP made from the supplied hamster recording live under `public/media`. The ZIP intentionally omits `node_modules` and `dist`; install and build them using the commands above.

## Gameplay

Click **Enter the Pond**, then type the original passage into the visible input. The duck changes only the displayed word directly before or after the active word, never the original passage or typed input. Each rendered line allows at most four changed words; if both adjacent words are on full lines, the duck skips that attempt. The first attempt begins 200–400 ms after two completed words; later substitutions obey the adaptive cooldown. A word changes only once per round. Continue typing the original text, including punctuation.

After each substitution, the duck has a roughly 4.4–5 second cooldown at a steady 35–85 WPM. The cooldown counts down faster if recent typing is below 35 WPM, above 85 WPM, or pauses for more than 1.5 seconds. The acceleration is capped at 2×. Input remains responsive and never resets the countdown.

For each attempt the duck glides to the screen for 450 ms, holds a suspicious stare for 550 ms, swoops to a still-eligible adjacent word for 420 ms, and changes it at the peck. The enlarged close-up lasts about one second. If the player moves the cursor before impact and the target is no longer valid, the peck is skipped. The adaptive cooldown starts only after a successful substitution. To adjust the close-up, edit `DUCK_ZOOM_MS` and `DUCK_STARE_MS` near the top of `src/App.jsx` and keep the `.duck-traveler` transition in `src/styles.css` aligned with the zoom time.

Sound is off by default. Use the `♫ OFF` control to turn on the supplied Duck Song 2 game music, trimmed by 1.5 seconds at the start and played quietly (volume 0.18). When results appear, it pauses, the supplied scorecard music loops at volume 0.16, and the “What the duck” clip plays. Restart stops scorecard music and resumes game music. The supplied logo sits at the top left. Results also show side confetti and the enlarged dancing hamster with its green screen removed. Reduced-motion settings hide confetti and the hamster animation.

After the first sabotage, each Backspace or Delete press increments **Quacks Given**, including a press at a text boundary. Corrections before sabotage do not count. Enter on the final word or a trailing space finishes the round; **Finish Round** also becomes available once the final word has been entered.

The score is `max(0, round(1000 × exact original words / total words − 35 × Quacks Given))`. An empty or random passage scores near zero. Restart resets the passage, timer, mutations, input, and penalties.

The scene is decorative and pointer transparent; no WebGL or model load is needed. CSS respects reduced motion, and the game remains operable without animation.
