import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cooldownRate, getProgress, pickAdjacentTarget, recentWpm, renderedLineIds, replaceWord, scoreRound, WORDS, REPLACEMENTS } from './gameLogic.js';
import './styles.css';

const HOME = { x: 83, y: 78 };
const FIRST_DELAY = () => 200 + Math.random() * 200;
const COOLDOWN = () => 4400 + Math.random() * 600;
// The enlarged close-up lasts DUCK_ZOOM_MS + DUCK_STARE_MS (1 second).
const DUCK_ZOOM_MS = 450;
const DUCK_STARE_MS = 550;
const DUCK_SWOOP_MS = 420;

function Duck({ pose, location, label }) {
  return <div className={`duck-traveler ${pose}`} style={{ left: `${location.x}%`, top: `${location.y}%` }} aria-hidden="true">
    <div className="duck-rings"><i/><i/><i/></div>
    <div className="duck-body"><svg viewBox="0 0 240 205" className="duck-art">
      <defs><radialGradient id="body"><stop stopColor="#fff5a5"/><stop offset=".65" stopColor="#f8cf50"/><stop offset="1" stopColor="#d8a13d"/></radialGradient><radialGradient id="head"><stop stopColor="#fff6af"/><stop offset=".7" stopColor="#ffdb64"/><stop offset="1" stopColor="#dea438"/></radialGradient><linearGradient id="bill" x2=".2" y2="1"><stop stopColor="#ffa85c"/><stop offset="1" stopColor="#d76832"/></linearGradient></defs>
      <ellipse cx="117" cy="181" rx="83" ry="14" fill="#064d50" opacity=".24"/>
      <path d="M50 120C31 102 38 78 50 66c-2 21 7 29 19 30Z" fill="#e8ad3d" stroke="#b98737" strokeWidth="3"/>
      <path d="M37 126c1-38 37-65 82-65 47 0 82 27 80 63-2 35-37 56-83 56-46 0-80-18-79-54Z" fill="url(#body)" stroke="#bf8d35" strokeWidth="3"/>
      <path d="M68 130c9-22 34-30 61-21 15 5 24 16 24 28-17 22-49 28-72 13-9-5-13-12-13-20Z" fill="#eeb740" stroke="#ce9735" strokeWidth="3"/>
      <path d="M84 132c21-13 37-13 55-4" fill="none" stroke="#ffe07e" strokeWidth="4" strokeLinecap="round"/>
      <path d="M114 69c-4-17 9-43 31-49 28-8 55 7 60 32 6 26-13 51-42 54-23 3-40-13-49-37Z" fill="url(#head)" stroke="#bf8d35" strokeWidth="3"/>
      <path d="M182 75c24-9 47-6 52 3 2 8-16 18-42 18-10 0-15-6-18-12Z" fill="url(#bill)" stroke="#b85e2f" strokeWidth="3"/>
      <path d="M189 85c13 4 29 3 41-1" fill="none" stroke="#ba5d2d" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="173" cy="56" rx="7" ry="9" fill="#342b23"/><circle cx="175" cy="53" r="2.3" fill="white"/>
      <path d="M158 40c7-6 16-6 22-2" fill="none" stroke="#80512c" strokeWidth="4" strokeLinecap="round"/>
      <path d="M84 173l-4 10m32-7 4 9" stroke="#d87b35" strokeWidth="8" strokeLinecap="round"/>
      <path d="M73 182c-9 0-17 4-18 8 7 5 19 5 29 0m34-6c-3 0-9 4-10 8 8 5 20 5 29-1" fill="#ed8b3e" stroke="#bd6630" strokeWidth="2"/>
    </svg></div><span className="duck-label">{label}</span>
  </div>;
}

function PondDecor() {
  return <div className="pond-decor" aria-hidden="true"><div className="water-glow"/><div className="eddy eddy-one"/><div className="eddy eddy-two"/><div className="eddy eddy-three"/><div className="shore shore-top"/><div className="shore shore-bottom"/>
    <div className="lily lily-one"><i/><b/></div><div className="lily lily-two"><i/></div><div className="lily lily-three"><i/><b/></div><div className="lily lily-four"><i/></div>
    <div className="reeds reeds-left"><i/><i/><i/><i/><i/></div><div className="reeds reeds-right"><i/><i/><i/><i/></div><span className="bubble bubble-one"/><span className="bubble bubble-two"/><span className="bubble bubble-three"/><span className="leaf leaf-one"/><span className="leaf leaf-two"/>
  </div>;
}

function Header({ status, elapsed, wpm, accuracy, quacks, reaction, onRestart, soundOn, onSoundToggle }) {
  return <header className="topbar"><div className="identity"><img className="brand-logo" src="/media/what-the-duck-logo.jpeg" alt="What the Duck logo"/><div><strong>ZERO QUACKS GIVEN<span>.</span></strong><small>THE PONDSIDE TYPING CLUB</small></div></div><div className="header-right">
    <div className="header-stat"><small>TIME</small><strong>{String(Math.floor(elapsed / 60)).padStart(2,'0')}:{String(elapsed % 60).padStart(2,'0')}</strong></div><div className="header-stat"><small>WPM</small><strong>{wpm ?? '—'}</strong></div><div className="header-stat"><small>ACCURACY</small><strong>{accuracy}%</strong></div><div className="header-stat"><small>QUACKS GIVEN</small><strong>{String(quacks).padStart(2,'0')}</strong></div><button className="sound-button" onClick={onSoundToggle} aria-label={soundOn ? 'Mute sound' : 'Enable sound'} aria-pressed={soundOn}>{soundOn ? '♫ ON' : '♫ OFF'}</button><div className="status-pill"><i/>{reaction}</div>{status !== 'start' && <button className="icon-button" onClick={onRestart} title="Restart round" aria-label="Restart round">↻</button>}
  </div></header>;
}

function Passage({ displayWords, progress, mutatedIndices, flashIndex, wordRefs }) {
  return <div className="passage" aria-label="Typing passage">{displayWords.map((word, index) => {
    const completed = index < progress.completedCount;
    const correct = completed && progress.tokens[index] === WORDS[index];
    return <span key={index} ref={el => { wordRefs.current[index] = el; }} className={`word ${completed ? correct ? 'correct' : 'incorrect' : ''} ${index === progress.cursorIndex ? 'active' : ''} ${mutatedIndices.has(index) ? 'sabotaged' : ''} ${flashIndex === index ? 'flash' : ''}`}>{word}{index < WORDS.length - 1 ? ' ' : ''}</span>;
  })}</div>;
}

function Results({ result, elapsed, onRestart }) {
  const verdict = result.quacks === 0 && result.accuracy >= 95 ? 'THE DUCK FEARS YOU.' : result.score >= 750 ? 'BREAD PRIVILEGES REVOKED.' : result.quacks > 8 ? 'THE POND COURT FINDS YOU GUILTY.' : 'THE DUCK CALLS THAT A DRAW.';
  return <div className="result-overlay"><div className="confetti confetti-left" aria-hidden="true">{Array.from({length:28},(_,i)=><i key={i} style={{'--i':i,'--c':['#ffc72c','#9ef1ef','#f28d63','#a8de86'][i%4]}}/>)}</div><div className="confetti confetti-right" aria-hidden="true">{Array.from({length:28},(_,i)=><i key={i} style={{'--i':i,'--c':['#ffc72c','#9ef1ef','#f28d63','#a8de86'][i%4]}}/>)}</div><div className="result-card"><div className="round-stamp">✳ &nbsp; ROUND COMPLETE &nbsp; ✳</div><h2>{verdict}</h2><p>The duck insists it was all part of the lesson.</p><div className="big-score"><span>FINAL SCORE</span><strong>{result.score}</strong><small>/ 1,000</small></div><div className="result-metrics"><div><small>ORIGINAL ACCURACY</small><strong>{result.accuracy}%</strong></div><div><small>QUACKS GIVEN</small><strong>{result.quacks}</strong></div><div><small>WORDS RIGHT</small><strong>{result.exact}/{WORDS.length}</strong></div><div><small>TIME</small><strong>{elapsed}s</strong></div></div><div className="hamster-caption"><img src="/media/dancing-hamster.webp" alt="Dancing hamster celebrating the round"/><span>THE POND'S OFFICIAL CELEBRATION COMMITTEE</span></div><button className="primary-button" onClick={onRestart}>PLAY AGAIN <span>↗</span></button></div></div>;
}

export default function App() {
  const [status, setStatus] = useState('start');
  const [round, setRound] = useState(0);
  const [typedInput, setTypedInput] = useState('');
  const [displayWords, setDisplayWords] = useState([...WORDS]);
  const [mutatedIndices, setMutatedIndices] = useState(new Set());
  const [quacksGiven, setQuacksGiven] = useState(0);
  const [mutationLog, setMutationLog] = useState([]);
  const [duckReaction, setDuckReaction] = useState('POND PATROL');
  const [duckPose, setDuckPose] = useState('idle');
  const [duckPosition, setDuckPosition] = useState(HOME);
  const [flashIndex, setFlashIndex] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [armed, setArmed] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const wordRefs = useRef([]), textareaRef = useRef(null), timerRef = useRef(null), animationTimers = useRef([]), startTime = useRef(0), mutationCountRef = useRef(0), quacksRef = useRef(0), latest = useRef({});
  const sequenceRunning = useRef(false), musicRef = useRef(null), scoreMusicRef = useRef(null), memeRef = useRef(null), resultSoundRef = useRef(null);
  const cooldownRemaining = useRef(0), lastCooldownTick = useRef(0), inputSamples = useRef([]), lastInputAt = useRef(0);
  const progress = getProgress(typedInput);
  const wpm = elapsed ? Math.round((typedInput.length / 5) / (elapsed / 60)) : null;
  const liveAccuracy = progress.completedCount ? Math.round(100 * progress.tokens.slice(0, progress.completedCount).filter((w,i) => w === WORDS[i]).length / progress.completedCount) : 100;
  latest.current = { progress, displayWords, mutatedIndices, status };

  const clearTimers = useCallback(() => { clearTimeout(timerRef.current); animationTimers.current.forEach(clearTimeout); animationTimers.current = []; sequenceRunning.current = false; }, []);
  useEffect(() => () => clearTimers(), [clearTimers]);
  useEffect(() => {
    musicRef.current = new Audio('/media/pond-bgm.mp3'); musicRef.current.loop = true; musicRef.current.volume = .18;
    scoreMusicRef.current = new Audio('/media/scorecard-bgm.mp3'); scoreMusicRef.current.loop = true; scoreMusicRef.current.volume = .16;
    memeRef.current = new Audio('/media/duck-meme.mp3'); memeRef.current.volume = .42;
    resultSoundRef.current = new Audio('/media/what-the-duck.mp3'); resultSoundRef.current.volume = .9;
    return () => { [musicRef,scoreMusicRef,memeRef,resultSoundRef].forEach(ref => { ref.current?.pause(); ref.current = null; }); };
  }, []);
  const playClip = useCallback(ref => { if (!soundOn || !ref.current) return; ref.current.currentTime = 0; ref.current.play().catch(() => {}); }, [soundOn]);
  const toggleSound = () => {
    setSoundOn(previous => {
      if (previous) { musicRef.current?.pause(); scoreMusicRef.current?.pause(); memeRef.current?.pause(); resultSoundRef.current?.pause(); }
      else if (status === 'playing') musicRef.current?.play().catch(() => {});
      else if (status === 'results') { scoreMusicRef.current?.play().catch(() => {}); resultSoundRef.current.currentTime = 0; resultSoundRef.current?.play().catch(() => {}); }
      return !previous;
    });
  };
  const later = useCallback((callback, delay) => { animationTimers.current.push(setTimeout(callback, delay)); }, []);

  const reset = useCallback(() => {
    clearTimers(); mutationCountRef.current = 0; quacksRef.current = 0;
    resultSoundRef.current?.pause(); scoreMusicRef.current?.pause(); memeRef.current?.pause();
    if (soundOn) { musicRef.current.currentTime = 0; musicRef.current?.play().catch(() => {}); }
    cooldownRemaining.current = 0; lastCooldownTick.current = 0; inputSamples.current = []; lastInputAt.current = Date.now();
    setRound(n => n + 1); setTypedInput(''); setDisplayWords([...WORDS]); setMutatedIndices(new Set()); setQuacksGiven(0); setMutationLog([]);
    setDuckReaction('POND PATROL'); setDuckPose('idle'); setDuckPosition(HOME); setFlashIndex(-1); setElapsed(0); setResult(null); setArmed(false);
    startTime.current = Date.now(); setStatus('playing'); requestAnimationFrame(() => textareaRef.current?.focus());
  }, [clearTimers, soundOn]);

  const finish = useCallback((input) => {
    setResult(scoreRound(input, quacksRef.current)); setStatus('results'); setDuckPose('celebrate'); setDuckReaction('I MEANT TO DO THAT'); clearTimers();
    musicRef.current?.pause();
    if (soundOn) { scoreMusicRef.current.currentTime = 0; scoreMusicRef.current?.play().catch(() => {}); }
    playClip(resultSoundRef);
  }, [clearTimers, playClip, soundOn]);

  const performMutation = useCallback((onImpact) => {
    const current = latest.current;
    if (current.status !== 'playing' || sequenceRunning.current) return false;
    const eligible = () => pickAdjacentTarget(latest.current.progress.cursorIndex, latest.current.mutatedIndices, Math.random, renderedLineIds(wordRefs.current.map(word => word?.getBoundingClientRect().top ?? 0)));
    if (eligible() === null) return false;
    sequenceRunning.current = true;
    animationTimers.current.forEach(clearTimeout);
    animationTimers.current = [];
    setDuckPose('zoom'); setDuckPosition({x:50,y:50}); setDuckReaction('BARNABY SEES YOU…');
    playClip(memeRef);
    later(() => {
      setDuckPose('stare'); setDuckReaction('SUS.');
      later(() => {
        const target = eligible();
        if (target === null) { sequenceRunning.current = false; setDuckPose('idle'); setDuckReaction('POND PATROL'); onImpact(false); return; }
        const rect = wordRefs.current[target]?.getBoundingClientRect();
        const x = rect ? Math.max(12, Math.min(88, (rect.left + rect.width / 2) / window.innerWidth * 100)) : 50;
        const y = rect ? Math.max(20, Math.min(82, (rect.top + rect.height / 2) / window.innerHeight * 100)) : 50;
        setDuckPose('swoop'); setDuckPosition({x,y}); setDuckReaction('BEAK ATTACK!');
        later(() => {
          // Typing can move the cursor during the flight. A stale target is skipped.
          const now = latest.current;
          const lineIds = renderedLineIds(wordRefs.current.map(word => word?.getBoundingClientRect().top ?? 0));
          const valid = [now.progress.cursorIndex - 1, now.progress.cursorIndex + 1].includes(target)
            && !now.mutatedIndices.has(target)
            && pickAdjacentTarget(now.progress.cursorIndex, now.mutatedIndices, () => target < now.progress.cursorIndex ? 0 : .999, lineIds) === target;
          if (!valid || now.status !== 'playing') { sequenceRunning.current = false; setDuckPose('escape'); later(() => { setDuckPose('idle'); setDuckReaction('POND PATROL'); }, 600); onImpact(false); return; }
          const original = WORDS[target], nextWord = replaceWord(original, REPLACEMENTS[Math.floor(Math.random() * REPLACEMENTS.length)]);
          setDisplayWords(previous => previous.map((word, index) => index === target ? nextWord : word));
          setMutatedIndices(previous => new Set(previous).add(target)); mutationCountRef.current += 1;
          setFlashIndex(target); setMutationLog(previous => [{ id: Date.now() + Math.random(), message: `Duck changed “${original}” to “${nextWord}”.` }, ...previous].slice(0, 3));
          setDuckPose('bonk'); setDuckReaction('BONK!'); sequenceRunning.current = false; onImpact(true);
          later(() => { setDuckPose('escape'); setDuckPosition({ x: 84, y: 75 }); }, 380);
          later(() => { setDuckPose('idle'); setDuckReaction('COOLING OFF'); setFlashIndex(-1); }, 1000);
        }, DUCK_SWOOP_MS);
      }, DUCK_STARE_MS);
    }, DUCK_ZOOM_MS);
    return true;
  }, [later, playClip]);
  const mutationAction = useRef(performMutation); mutationAction.current = performMutation;

  useEffect(() => {
    if (status !== 'playing' || !armed) return;
    let live = true;
    const attempt = () => {
      if (!live) return;
      if (mutationAction.current(success => {
        if (!live) return;
        if (!success) { timerRef.current = setTimeout(attempt, 900); return; }
        // The cooldown begins at substitution, not at the end of the animation.
        cooldownRemaining.current = COOLDOWN();
        lastCooldownTick.current = Date.now();
        tick();
      })) {
        // The flying sequence owns the clock until the actual peck.
      } else {
        // No adjacent unused word: retry later without spinning or resetting input.
        timerRef.current = setTimeout(attempt, 800 + Math.random() * 400);
      }
    };
    const tick = () => {
      timerRef.current = setTimeout(() => {
        if (!live) return;
        const now = Date.now();
        const elapsed = now - lastCooldownTick.current;
        lastCooldownTick.current = now;
        cooldownRemaining.current -= elapsed * cooldownRate(recentWpm(inputSamples.current, now), now - lastInputAt.current);
        if (cooldownRemaining.current <= 0) attempt(); else tick();
      }, 100);
    };
    timerRef.current = setTimeout(attempt, FIRST_DELAY());
    return () => { live = false; clearTimeout(timerRef.current); };
  }, [status, armed, round]);
  useEffect(() => {
    if (status !== 'playing') return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 250);
    return () => clearInterval(id);
  }, [status, round]);

  const handleInput = event => {
    const next = event.target.value.replace(/\r/g, '').replace(/\n/g, ' ');
    const added = next.length - typedInput.length;
    if (added > 0 && added <= 3) {
      const now = Date.now();
      inputSamples.current.push({ at: now, chars: added });
      inputSamples.current = inputSamples.current.filter(sample => now - sample.at <= 6000);
      lastInputAt.current = now;
    }
    setTypedInput(next);
    const nextProgress = getProgress(next);
    if (!armed && nextProgress.completedCount >= 2) setArmed(true);
    if (nextProgress.tokens.length >= WORDS.length && /\s$/.test(next)) finish(next);
  };
  const handleKeyDown = event => {
    if ((event.key === 'Backspace' || event.key === 'Delete') && mutationCountRef.current > 0) { quacksRef.current += 1; setQuacksGiven(quacksRef.current); }
    if (event.key === 'Enter') { event.preventDefault(); if (progress.tokens.length >= WORDS.length) finish(typedInput); }
  };

  return <div className="world"><PondDecor/><div className={`meme-vignette ${duckPose === 'zoom' || duckPose === 'stare' ? 'shown' : ''}`} aria-hidden="true"><div className="meme-banner">BARNABY SEES NO QUACKS… <b>SUS!</b></div></div><Duck pose={duckPose} location={duckPosition} label={duckReaction}/>
    <Header status={status} elapsed={elapsed} wpm={wpm} accuracy={status === 'results' ? result.accuracy : liveAccuracy} quacks={quacksGiven} reaction={duckReaction} onRestart={reset} soundOn={soundOn} onSoundToggle={toggleSound}/>
    {status === 'start' ? <main className="start-card"><span className="eyebrow">A TINY POND. A VERY PERSONAL GRUDGE.</span><h1>Type fast.<br/><em>Trust no duck.</em></h1><p>The duck changes words beside your cursor. Keep typing the <strong>original passage</strong>—and try not to give a single quack.</p><button className="primary-button" onClick={reset}>ENTER THE POND <span>↗</span></button><div className="start-footnote">ONE ROUND · {WORDS.length} WORDS · UNLIMITED MISCHIEF</div></main> : <main className="game-shell">
      <div className="panel-head"><div><span className="eyebrow">BARNABY'S SUSPICIOUS TYPING WATERS</span><h1>Liquid Glass Stream<span>.</span></h1></div><div className="progress-badge"><strong>{Math.min(progress.completedCount, WORDS.length)}</strong><span>/ {WORDS.length}<small>WORDS</small></span></div></div>
      <div className="typing-panel"><div className="paper-heading"><span><i className="green-dot"/> THE PASSAGE</span><span>TYPE WHAT YOU FIRST SAW, NOT WHAT THE DUCK SHOWS</span></div><Passage displayWords={displayWords} progress={progress} mutatedIndices={mutatedIndices} flashIndex={flashIndex} wordRefs={wordRefs}/>
        <div className="input-wrap"><label htmlFor="typing-input">YOUR TYPING</label><textarea id="typing-input" ref={textareaRef} value={typedInput} onChange={handleInput} onKeyDown={handleKeyDown} disabled={status === 'results'} spellCheck="false" autoComplete="off" autoCorrect="off" autoCapitalize="off" placeholder="Start typing the original passage here…" aria-describedby="typing-help"/><span id="typing-help">Spaces complete words. Press Enter on the final word to finish.</span></div>
        <div className="panel-footer"><span><b>✳ POND RULE</b> Only the words directly beside your cursor can change.</span><button onClick={() => finish(typedInput)} disabled={progress.tokens.length < WORDS.length || status === 'results'}>FINISH ROUND ↗</button></div>
      </div><div className="under-panel"><div className="log-box"><span className="log-title">POND ACTIVITY <i/></span><div aria-live="polite">{mutationLog.length ? mutationLog.map(item => <p key={item.id}>{item.message}</p>) : <p>Still waters. Suspiciously still waters.</p>}</div></div><div className="score-note"><span>HOW TO SCORE</span><p>Original words right × 1,000 ÷ {WORDS.length}, then −35 for every Quack Given.</p></div></div>
    </main>}
    {status === 'results' && result && <Results result={result} elapsed={elapsed} onRestart={reset}/>}
    <div className="corner-caption">EST. SOMEWHERE NEAR A POND <span>✳</span> 2026</div>
  </div>;
}
