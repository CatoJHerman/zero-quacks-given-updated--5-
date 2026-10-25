import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS, PASSAGE, cooldownRate, getProgress, pickAdjacentTarget, recentWpm, renderedLineIds, replaceWord, scoreRound } from './gameLogic.js';

test('only the immediately previous or next word can be targeted', () => {
  assert.equal(pickAdjacentTarget(8, new Set(), () => 0), 7);
  assert.equal(pickAdjacentTarget(8, new Set(), () => .99), 9);
  assert.equal(pickAdjacentTarget(8, new Set([7]), () => 0), 9);
  assert.equal(pickAdjacentTarget(8, new Set([7,9]), () => 0), null);
  assert.equal(pickAdjacentTarget(0, new Set(), () => 0), 1);
  assert.equal(pickAdjacentTarget(WORDS.length - 1, new Set(), () => 0), WORDS.length - 2);
});

test('each rendered line allows at most four changed words', () => {
  assert.deepEqual(renderedLineIds([120, 120.4, 120.1, 158, 158.2, 195]), [0, 0, 0, 1, 1, 2]);
  const lines = Array(WORDS.length).fill(2);
  for (const index of [1, 3, 5, 6, 7]) lines[index] = 0;
  for (const index of [9, 11, 12, 13, 14]) lines[index] = 1;
  assert.equal(pickAdjacentTarget(8, new Set([1, 3, 5, 6]), () => 0, lines), 9);
  assert.equal(pickAdjacentTarget(8, new Set([1, 3, 5, 6, 11, 12, 13, 14]), () => 0, lines), null);
  assert.equal(pickAdjacentTarget(8, new Set([1, 3, 5]), () => 0, lines), 7);
});

test('progress arms after two completed words and does not count the active word', () => {
  assert.deepEqual(getProgress('At the '), { tokens: ['At','the'], completedCount: 2, cursorIndex: 2 });
  assert.equal(getProgress('At the edge').completedCount, 2);
  assert.equal(getProgress('At the edge').cursorIndex, 2);
});

test('replacement preserves punctuation and token position', () => {
  assert.equal(replaceWord('pond,', 'breadbandit'), 'breadbandit,');
  assert.equal(replaceWord('“quiet!”', 'beakzilla'), '“beakzilla!”');
});

test('score uses original words and correction penalty', () => {
  assert.deepEqual(scoreRound(PASSAGE, 0), { exact: WORDS.length, quacks: 0, accuracy: 100, score: 1000 });
  assert.equal(scoreRound(PASSAGE, 2).score, 930);
  assert.equal(scoreRound('', 0).score, 0);
  assert.equal(scoreRound(Array(WORDS.length).fill('random').join(' '), 0).score, 0);
});

test('cooldown speeds up for fast, slow, and idle typing', () => {
  assert.equal(cooldownRate(60, 200), 1);
  assert.ok(cooldownRate(10, 200) > 1);
  assert.ok(cooldownRate(150, 200) > 1);
  assert.ok(cooldownRate(60, 4000) > 1);
  assert.ok(cooldownRate(60, 10000) <= 2);
  assert.equal(recentWpm([{ at: 0, chars: 5 }, { at: 1000, chars: 5 }], 2000), 60);
});
