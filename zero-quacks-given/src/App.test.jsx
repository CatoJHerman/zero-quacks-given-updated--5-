// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App.jsx';
import { PASSAGE, WORDS } from './gameLogic.js';

beforeEach(() => { vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0); vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(); vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

function begin() {
  render(<App/>);
  fireEvent.click(screen.getByRole('button', { name: /enter the pond/i }));
  return screen.getByLabelText('YOUR TYPING');
}

test('first sabotage changes only the previous word, then correction counts once', () => {
  const input = begin();
  fireEvent.keyDown(input, { key: 'Backspace' });
  expect(screen.getByText('00', { selector: '.header-stat strong' })).toBeTruthy();
  fireEvent.change(input, { target: { value: 'At the edge' } });
  act(() => vi.advanceTimersByTime(850));
  expect(document.querySelectorAll('.word.sabotaged')).toHaveLength(0);
  expect(document.querySelector('.duck-traveler.stare')).toBeTruthy();
  act(() => vi.advanceTimersByTime(900));
  expect(screen.getByText(/Duck changed “the” to “quackademic”/)).toBeTruthy();
  expect(input.value).toBe('At the edge');
  expect(document.querySelectorAll('.word.sabotaged')).toHaveLength(1);
  expect(document.querySelectorAll('.word.active')).toHaveLength(1);
  expect(document.querySelector('.word.active.sabotaged')).toBeNull();
  fireEvent.change(input, { target: { value: '' } });
  fireEvent.keyDown(input, { key: 'Backspace' });
  expect(screen.getByText('01', { selector: '.header-stat strong' })).toBeTruthy();
  fireEvent.change(input, { target: { value: `${PASSAGE} ` } });
  expect(screen.getByText('965', { selector: '.big-score strong' })).toBeTruthy();
  expect(screen.getByText(`${WORDS.length}/${WORDS.length}`)).toBeTruthy();
  act(() => vi.advanceTimersByTime(3000));
  expect(screen.getByText('965', { selector: '.big-score strong' })).toBeTruthy();
});

test('next-word mutation, restart, and complete round', () => {
  Math.random.mockReturnValue(.99);
  const input = begin();
  fireEvent.change(input, { target: { value: 'At the edge' } });
  act(() => vi.advanceTimersByTime(1900));
  expect(screen.getByText(/Duck changed “of” to “pondcriminal”/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Restart round' }));
  const restarted = screen.getByLabelText('YOUR TYPING');
  expect(restarted.value).toBe('');
  expect(document.querySelectorAll('.word.sabotaged')).toHaveLength(0);
  act(() => vi.advanceTimersByTime(1600));
  expect(document.querySelectorAll('.word.sabotaged')).toHaveLength(0);
  fireEvent.change(restarted, { target: { value: PASSAGE } });
  fireEvent.keyDown(restarted, { key: 'Enter' });
  expect(screen.getByText('1000', { selector: '.big-score strong' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /play again/i }));
  expect(screen.getByLabelText('YOUR TYPING').value).toBe('');
});

test('substitutions have a cooldown even when the player is idle', () => {
  const input = begin();
  fireEvent.change(input, { target: { value: 'At the edge' } });
  act(() => vi.advanceTimersByTime(1750));
  expect(document.querySelectorAll('.word.sabotaged')).toHaveLength(1);
  act(() => vi.advanceTimersByTime(2000));
  expect(document.querySelectorAll('.word.sabotaged')).toHaveLength(1);
  act(() => vi.advanceTimersByTime(3000));
  expect(document.querySelectorAll('.word.sabotaged')).toHaveLength(2);
});

test('results show the hamster and side confetti, with result sound when enabled', () => {
  const input = begin();
  expect(screen.getByAltText('What the Duck logo')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Enable sound' }));
  expect(HTMLMediaElement.prototype.play.mock.contexts.some(audio => audio.src.endsWith('/media/pond-bgm.mp3'))).toBe(true);
  fireEvent.change(input, { target: { value: `${PASSAGE} ` } });
  expect(screen.getByAltText('Dancing hamster celebrating the round')).toBeTruthy();
  expect(document.querySelectorAll('.confetti i')).toHaveLength(56);
  expect(HTMLMediaElement.prototype.play.mock.contexts.some(audio => audio.src.endsWith('/media/scorecard-bgm.mp3'))).toBe(true);
  expect(HTMLMediaElement.prototype.play.mock.contexts.some(audio => audio.src.endsWith('/media/what-the-duck.mp3'))).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: /play again/i }));
  expect(HTMLMediaElement.prototype.pause.mock.contexts.some(audio => audio.src.endsWith('/media/scorecard-bgm.mp3'))).toBe(true);
});

test('moving the cursor away before the peck skips a stale target', () => {
  const input = begin();
  fireEvent.change(input, { target: { value: 'At the edge' } });
  act(() => vi.advanceTimersByTime(1400));
  fireEvent.change(input, { target: { value: 'At the edge of a quiet pond, a small yellow duck' } });
  act(() => vi.advanceTimersByTime(400));
  expect(document.querySelectorAll('.word.sabotaged')).toHaveLength(0);
});
