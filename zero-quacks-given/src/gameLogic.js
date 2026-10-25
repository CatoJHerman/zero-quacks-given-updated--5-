export const PASSAGE = 'At the edge of a quiet pond, a small yellow duck inspected the morning like a very serious farmer. Three curious clouds drifted overhead, while the reeds whispered secrets to a sleepy frog. The duck had one important job today: to deliver a perfectly ordinary letter without causing an extraordinary amount of nonsense.';
export const WORDS = Object.freeze(PASSAGE.trim().split(/\s+/));
export const REPLACEMENTS = Object.freeze(['quackademic','breadbandit','pondgremlin','beakzilla','ducktective','quackmageddon','billgoblin','waddlemonger','featherfelon','breadnado','quackspiracy','pondcriminal']);
export const MAX_MUTATIONS_PER_LINE = 4;

export function getProgress(input) {
  const tokens = input.trim() ? input.trim().split(/\s+/) : [];
  const trailingSpace = /\s$/.test(input);
  return { tokens,
    completedCount: Math.min(WORDS.length, trailingSpace ? tokens.length : Math.max(0, tokens.length - 1)),
    cursorIndex: Math.min(WORDS.length - 1, trailingSpace ? tokens.length : Math.max(0, tokens.length - 1)) };
}
// Group word positions by their rendered vertical coordinate. This follows
// browser wrapping on desktop and mobile instead of assuming a fixed word count.
export function renderedLineIds(wordTops) {
  const lineTops = [];
  return wordTops.map(top => {
    const existing = lineTops.findIndex(lineTop => Math.abs(lineTop - top) < 3);
    if (existing !== -1) return existing;
    lineTops.push(top);
    return lineTops.length - 1;
  });
}

export function pickAdjacentTarget(cursorIndex, mutatedIndices, rng = Math.random, lineIds = null) {
  const options = [cursorIndex - 1, cursorIndex + 1].filter(index => {
    if (index < 0 || index >= WORDS.length || mutatedIndices.has(index)) return false;
    if (!lineIds) return true;
    let usedOnLine = 0;
    for (const alteredIndex of mutatedIndices) {
      if (lineIds[alteredIndex] === lineIds[index]) usedOnLine++;
    }
    return usedOnLine < MAX_MUTATIONS_PER_LINE;
  });
  return options.length ? options[Math.floor(rng() * options.length)] : null;
}
export function replaceWord(original, replacement) {
  const match = original.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}'’-]+)([^\p{L}\p{N}]*)$/u);
  return match ? `${match[1]}${replacement}${match[3]}` : replacement;
}

// A steady 35–85 WPM earns the full breather. Extreme pace and inactivity
// consume the cooldown faster, but never more than about twice as fast.
export function cooldownRate(wpm, idleMs) {
  const slow = wpm === null ? 0 : Math.max(0, (35 - wpm) / 35);
  const fast = wpm === null ? 0 : Math.max(0, (wpm - 85) / 85);
  const idle = Math.max(0, (idleMs - 1500) / 2500);
  return 1 + Math.min(1, Math.max(slow * 0.8, fast * 0.8, idle));
}

export function recentWpm(samples, now) {
  const recent = samples.filter(sample => now - sample.at <= 6000);
  const chars = recent.reduce((count, sample) => count + sample.chars, 0);
  if (chars < 4) return null;
  return chars * 12000 / Math.max(1000, now - recent[0].at);
}
export function scoreRound(input, quacks) {
  const tokens = getProgress(input).tokens;
  const exact = WORDS.reduce((count, word, index) => count + (tokens[index] === word ? 1 : 0), 0);
  return { exact, quacks, accuracy: Math.round(exact / WORDS.length * 100), score: Math.max(0, Math.round(1000 * exact / WORDS.length - 35 * quacks)) };
}
