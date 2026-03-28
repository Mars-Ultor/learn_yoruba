import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { lessonsApi, progressApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { Lesson, Phrase } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────
const REQUIRED_REPS = 3;    // consecutive correct repetitions per phrase
const TIME_LIMIT_SEC = 30;  // seconds per attempt
const PASS_THRESHOLD = 90;  // minimum score % to pass

// ─── Helpers ──────────────────────────────────────────────────────────────────
type PhraseResult = { phrase: Phrase; passed: boolean; attempts: number };

function normalise(text: string) {
  return text.replace(/[.,!?]/g, '').toLowerCase().trim();
}

function scorePercent(results: PhraseResult[]) {
  if (!results.length) return 0;
  return Math.round((results.filter((r) => r.passed).length / results.length) * 100);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function IntensiveDrill() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const [phase, setPhase] = useState<'select' | 'overview' | 'drill' | 'results'>('select');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [repsRemaining, setRepsRemaining] = useState(REQUIRED_REPS);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SEC);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [results, setResults] = useState<PhraseResult[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [drillStartTime, setDrillStartTime] = useState<number>(0);
  const [drillDuration, setDrillDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } =
    useSpeechRecognition({
      lang: 'yo',
      onResult: (spoken) => {
        if (!selectedLesson) return;
        evaluateResponse(spoken, selectedLesson.phrases[phraseIdx]);
      },
    });

  useEffect(() => {
    lessonsApi.getAll().then((r) => {
      setLessons(r.data);
      setLoadingLessons(false);
    });
  }, []);

  // Persist progress whenever the results phase is reached
  useEffect(() => {
    if (phase !== 'results' || !selectedLesson || !user) return;
    progressApi
      .updateProgress({ userId: user.uid, lessonId: selectedLesson.id, score: scorePercent(results) })
      .catch((err) => console.error('Error saving drill progress:', err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (!isTimerRunning) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setIsTimerRunning(false);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [isTimerRunning]);

  const handleTimeout = useCallback(() => {
    setFeedback({ ok: false, msg: '⏱ Time expired — try the phrase again.' });
    setAttempts((a) => a + 1);
    resetTranscript();
  }, [resetTranscript]);

  const evaluateResponse = useCallback(
    (spoken: string, phrase: Phrase) => {
      setIsTimerRunning(false);
      const matched =
        normalise(spoken) === normalise(phrase.yoruba) ||
        normalise(spoken).includes(normalise(phrase.yoruba)) ||
        normalise(phrase.yoruba).includes(normalise(spoken));

      setAttempts((a) => a + 1);

      if (matched) {
        setFeedback({ ok: true, msg: '✅ Correct! Say it again.' });
        setRepsRemaining((r) => {
          const next = r - 1;
          if (next <= 0) setTimeout(() => advancePhrase(), 1200);
          return next;
        });
      } else {
        setFeedback({ ok: false, msg: `❌ Not quite. Expected: "${phrase.yoruba}"` });
      }
      resetTranscript();
    },
    [resetTranscript],
  );

  const advancePhrase = useCallback(() => {
    if (!selectedLesson) return;
    const phrase = selectedLesson.phrases[phraseIdx];
    setResults((prev) => {
      const updated = [...prev, { phrase, passed: true, attempts }];
      if (phraseIdx + 1 >= selectedLesson.phrases.length) {
        const duration = Math.round((Date.now() - drillStartTime) / 1000);
        setDrillDuration(duration);
        setTimeout(() => setPhase('results'), 600);
      } else {
        setPhraseIdx((i) => i + 1);
        setRepsRemaining(REQUIRED_REPS);
        setAttempts(0);
        setFeedback(null);
        resetTranscript();
        setTimeLeft(TIME_LIMIT_SEC);
        setIsTimerRunning(false);
      }
      return updated;
    });
  }, [selectedLesson, phraseIdx, attempts, drillStartTime, resetTranscript]);

  const speak = (text: string) => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'yo';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  };

  const startDrill = () => {
    if (!selectedLesson) return;
    setPhraseIdx(0);
    setRepsRemaining(REQUIRED_REPS);
    setAttempts(0);
    setResults([]);
    setFeedback(null);
    setTimeLeft(TIME_LIMIT_SEC);
    setIsTimerRunning(false);
    setDrillStartTime(Date.now());
    setPhase('drill');
  };

  const startListenWithTimer = () => {
    setTimeLeft(TIME_LIMIT_SEC);
    setIsTimerRunning(true);
    resetTranscript();
    startListening();
  };

  const score = scorePercent(results);
  const passed = score >= PASS_THRESHOLD;
  const currentPhrase = selectedLesson?.phrases[phraseIdx];
  const totalPhrases = selectedLesson?.phrases.length ?? 0;
  const timerColor = timeLeft > 15 ? 'text-green-600' : timeLeft > 7 ? 'text-yellow-500' : 'text-red-600';

  // ── SELECT ─────────────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Intensive Pronunciation Drill</h1>
          <p className="text-gray-600 mt-2">
            High-repetition practice with timed responses. Each phrase must be spoken correctly{' '}
            <strong>{REQUIRED_REPS}×</strong> before you advance. Pass rate: <strong>{PASS_THRESHOLD}%</strong>. Timer:{' '}
            <strong>{TIME_LIMIT_SEC}s</strong> per attempt.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🔁', title: `${REQUIRED_REPS}× Repetition`, desc: 'Confirm every phrase 3 times in a row before moving on.' },
            { icon: '⏱', title: `${TIME_LIMIT_SEC}s Time Limit`, desc: 'Hard deadline per attempt to keep you focused.' },
            { icon: '🎯', title: `${PASS_THRESHOLD}% to Pass`, desc: 'Higher accuracy standard — builds strong habits.' },
          ].map((c) => (
            <div key={c.title} className="bg-white rounded-xl border-2 border-green-100 p-5 shadow-sm">
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="font-bold text-gray-900">{c.title}</div>
              <div className="text-gray-500 text-sm mt-1">{c.desc}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Choose a Lesson</h2>
          {loadingLessons ? (
            <p className="text-gray-500">Loading lessons…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => { setSelectedLesson(lesson); setPhase('overview'); }}
                  className="text-left p-4 border-2 border-gray-200 hover:border-green-500 rounded-xl transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 group-hover:text-green-700">{lesson.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      lesson.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      lesson.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{lesson.difficulty}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{lesson.phrases.length} phrases</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── OVERVIEW ───────────────────────────────────────────────────────────────
  if (phase === 'overview' && selectedLesson) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6 border-2 border-green-100">
          <div className="text-center space-y-2">
            <div className="text-4xl">📋</div>
            <h2 className="text-2xl font-bold text-gray-900">Session Overview</h2>
          </div>
          <div className="divide-y divide-gray-100 text-sm">
            {[
              ['Lesson', selectedLesson.title],
              ['Phrases', String(selectedLesson.phrases.length)],
              ['Repetitions per phrase', `${REQUIRED_REPS}×`],
              ['Time per attempt', `${TIME_LIMIT_SEC}s`],
              ['Pass threshold', `${PASS_THRESHOLD}%`],
              ['Difficulty', selectedLesson.difficulty],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2.5">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-900 capitalize">{value}</span>
              </div>
            ))}
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-gray-700 text-sm space-y-2">
            <p>🎯 <strong>Goal:</strong> Pronounce every phrase in this lesson accurately.</p>
            <p>🔁 <strong>How it works:</strong> Each phrase must be confirmed {REQUIRED_REPS} consecutive times. No response within {TIME_LIMIT_SEC}s counts as an incorrect attempt.</p>
            <p>✅ <strong>To pass:</strong> Reach at least {PASS_THRESHOLD}% accuracy across all phrases.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setPhase('select')} className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">
            ← Back
          </button>
          <button onClick={startDrill} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold transition-colors">
            Start Drill
          </button>
        </div>
      </div>
    );
  }

  // ── DRILL ──────────────────────────────────────────────────────────────────
  if (phase === 'drill' && selectedLesson && currentPhrase) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress bar */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Phrase {phraseIdx + 1} / {totalPhrases}</span>
          <div className="flex gap-1">
            {selectedLesson.phrases.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-6 rounded-full ${
                  i < phraseIdx ? 'bg-green-500' : i === phraseIdx ? 'bg-green-700' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-600">Reps: {REQUIRED_REPS - repsRemaining}/{REQUIRED_REPS}</span>
        </div>

        {/* Phrase card */}
        <div className="bg-white border-2 border-green-200 rounded-2xl p-8 text-center space-y-4 shadow-lg">
          <p className="text-gray-400 text-xs uppercase tracking-widest">Say this phrase</p>
          <p className="text-4xl font-bold text-gray-900">{currentPhrase.yoruba}</p>
          <p className="text-green-700 text-lg italic">{currentPhrase.pronunciation}</p>
          <p className="text-gray-500 text-sm">{currentPhrase.english}</p>
          {currentPhrase.context && (
            <p className="bg-gray-50 rounded-lg px-4 py-2 text-gray-600 text-sm">{currentPhrase.context}</p>
          )}
          <button
            onClick={() => speak(currentPhrase.yoruba)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            🔊 Hear pronunciation
          </button>
        </div>

        {/* Rep dots */}
        <div className="flex justify-center gap-3">
          {Array.from({ length: REQUIRED_REPS }).map((_, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full border-2 ${
                i >= repsRemaining ? 'bg-green-500 border-green-500' : 'border-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Timer */}
        {isTimerRunning && (
          <div className="text-center">
            <span className={`text-5xl font-mono font-bold ${timerColor}`}>{timeLeft}</span>
            <p className="text-gray-500 text-sm mt-1">seconds remaining</p>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`rounded-xl p-4 text-center font-semibold ${feedback.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {feedback.msg}
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="bg-blue-50 rounded-xl p-4 text-center text-blue-800 italic">
            You said: "{transcript}"
          </div>
        )}

        {!isSupported && (
          <div className="bg-yellow-50 text-yellow-800 rounded-xl p-4 text-center text-sm">
            Speech recognition is not supported in this browser. Use Chrome or Edge for the full drill experience.
          </div>
        )}

        <div className="flex gap-3">
          {isListening ? (
            <button onClick={stopListening} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg transition-colors">
              ⏹ Stop
            </button>
          ) : (
            <button onClick={startListenWithTimer} disabled={!isSupported} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white py-4 rounded-xl font-bold text-lg transition-colors">
              🎙 Speak
            </button>
          )}
        </div>

        <button
          onClick={() => {
            const failed: PhraseResult = { phrase: currentPhrase, passed: false, attempts: attempts + 1 };
            setResults((prev) => {
              const updated = [...prev, failed];
              if (phraseIdx + 1 >= totalPhrases) {
                const duration = Math.round((Date.now() - drillStartTime) / 1000);
                setDrillDuration(duration);
                setPhase('results');
              } else {
                setPhraseIdx((i) => i + 1);
                setRepsRemaining(REQUIRED_REPS);
                setAttempts(0);
                setFeedback(null);
                resetTranscript();
                setTimeLeft(TIME_LIMIT_SEC);
                setIsTimerRunning(false);
              }
              return updated;
            });
          }}
          className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 underline underline-offset-2 transition-colors"
        >
          Skip phrase
        </button>
      </div>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (phase === 'results' && selectedLesson) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6 border-2 border-green-100">
          <div className="text-center space-y-2">
            <div className="text-5xl">{passed ? '🏆' : '📈'}</div>
            <h2 className="text-2xl font-bold text-gray-900">Session Results</h2>
            <p className={`text-4xl font-bold ${passed ? 'text-green-600' : 'text-orange-500'}`}>{score}%</p>
            <p className={`text-sm font-semibold ${passed ? 'text-green-600' : 'text-orange-500'}`}>
              {passed ? 'Excellent — standard met!' : 'Keep going — try again to improve'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6 text-center text-sm">
            <div><p className="text-gray-400">Phrases</p><p className="text-xl font-bold text-gray-900">{results.length}</p></div>
            <div><p className="text-gray-400">Mastered</p><p className="text-xl font-bold text-green-600">{results.filter((r) => r.passed).length}</p></div>
            <div><p className="text-gray-400">Duration</p><p className="text-xl font-bold text-gray-900">{Math.floor(drillDuration / 60)}m {drillDuration % 60}s</p></div>
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-6">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Phrase Breakdown</p>
            {results.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={r.passed ? 'text-green-500' : 'text-red-400'}>{r.passed ? '✓' : '✗'}</span>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{r.phrase.yoruba}</span>
                  <span className="text-gray-400 text-xs ml-2">— {r.phrase.english}</span>
                </div>
                <span className="text-gray-400 text-xs">{r.attempts} attempt{r.attempts !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {!passed && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-orange-800 text-sm text-center">
            Score below {PASS_THRESHOLD}% — try the drill again to build stronger recall.
          </div>
        )}

        <div className="flex gap-4">
          <button onClick={() => setPhase('overview')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors">
            🔁 Try Again
          </button>
          <button onClick={() => setPhase('select')} className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">
            Choose Lesson
          </button>
        </div>
        <div className="text-center">
          <Link to="/lessons" className="text-green-600 hover:text-green-700 text-sm font-medium">
            ← Back to Lessons
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
