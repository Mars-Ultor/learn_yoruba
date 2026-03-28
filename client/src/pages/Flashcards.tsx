import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { flashcardsApi } from '../services/api';
import type { FlashcardReview, FlashcardQuality } from '../types';

const QUALITY_LABELS: { q: FlashcardQuality; label: string; color: string; hint: string }[] = [
  { q: 0, label: 'Again', color: 'bg-red-500 hover:bg-red-600', hint: 'Complete blackout / wrong' },
  { q: 1, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600', hint: 'Recalled with significant effort' },
  { q: 2, label: 'Good', color: 'bg-green-500 hover:bg-green-600', hint: 'Recalled with some hesitation' },
  { q: 3, label: 'Easy', color: 'bg-blue-500 hover:bg-blue-600', hint: 'Recalled immediately' },
];

export default function Flashcards() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cards, setCards] = useState<FlashcardReview[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialising, setInitialising] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadDueCards();
  }, [user]);

  const loadDueCards = async () => {
    setLoading(true);
    try {
      const res = await flashcardsApi.getDue(user!.uid);
      if (res.data.length === 0) {
        // Auto-init deck if no cards exist yet
        const allRes = await flashcardsApi.getAll(user!.uid);
        if (allRes.data.length === 0) {
          setInitialising(true);
          await flashcardsApi.init(user!.uid);
          const retry = await flashcardsApi.getDue(user!.uid);
          setCards(retry.data);
          setInitialising(false);
        } else {
          setCards([]);
        }
      } else {
        setCards(res.data);
      }
      setCurrentIdx(0);
      setRevealed(false);
      setSessionComplete(false);
      setReviewedCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleInit = async () => {
    setInitialising(true);
    try {
      await flashcardsApi.init(user!.uid);
      await loadDueCards();
    } finally {
      setInitialising(false);
    }
  };

  const handleReview = async (quality: FlashcardQuality) => {
    const card = cards[currentIdx];
    await flashcardsApi.review({ userId: user!.uid, vocabularyId: card.vocabularyId, quality });

    const nextIdx = currentIdx + 1;
    setReviewedCount((c) => c + 1);

    if (nextIdx >= cards.length) {
      setSessionComplete(true);
    } else {
      setCurrentIdx(nextIdx);
      setRevealed(false);
    }
  };

  const speak = (word: string) => {
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = 'yo';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading cards…</div>;
  }

  // ── Empty state — no cards initialised yet ─────────────────────────────────
  if (!loading && cards.length === 0 && reviewedCount === 0 && !sessionComplete) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-16">
        <div className="text-6xl">🃏</div>
        <h2 className="text-2xl font-bold text-gray-900">Flashcard Review</h2>
        <p className="text-gray-600">
          Start your Spaced Repetition deck — every vocabulary word will be queued for review at the optimal
          interval to lock it into long-term memory.
        </p>
        <button
          onClick={handleInit}
          disabled={initialising}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-colors"
        >
          {initialising ? 'Setting up deck…' : 'Start My Deck'}
        </button>
      </div>
    );
  }

  // ── Session complete ───────────────────────────────────────────────────────
  if (sessionComplete) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-16">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-900">Session Complete!</h2>
        <p className="text-gray-600">You reviewed <strong>{reviewedCount}</strong> card{reviewedCount !== 1 ? 's' : ''} this session.</p>
        <p className="text-gray-500 text-sm">Remaining cards will be due again based on your ratings. Come back tomorrow for the next batch.</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={loadDueCards}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
          >
            Review Again
          </button>
          <button
            onClick={() => navigate('/techniques')}
            className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Back to Techniques
          </button>
        </div>
      </div>
    );
  }

  // ── No cards due ───────────────────────────────────────────────────────────
  if (cards.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-16">
        <div className="text-6xl">🌟</div>
        <h2 className="text-2xl font-bold text-gray-900">All caught up!</h2>
        <p className="text-gray-600">No cards are due for review right now. Check back later — your next batch will be ready based on the intervals you set.</p>
        <button onClick={() => navigate('/vocabulary')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
          Browse Vocabulary
        </button>
      </div>
    );
  }

  // ── Active review ──────────────────────────────────────────────────────────
  const card = cards[currentIdx];
  const vocab = card.vocabulary;
  const progress = Math.round(((currentIdx) / cards.length) * 100);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Flashcard Review</h1>
        <span className="text-sm text-gray-500">
          {currentIdx + 1} / {cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card */}
      <div
        className={`bg-white rounded-2xl shadow-xl cursor-pointer select-none transition-all duration-200 ${revealed ? '' : 'hover:shadow-2xl'}`}
        onClick={() => !revealed && setRevealed(true)}
      >
        {/* Front */}
        <div className="p-8 text-center space-y-4">
          <p className="text-gray-400 text-xs uppercase tracking-widest">Yoruba</p>
          <p className="text-5xl font-bold text-gray-900">{vocab.word}</p>
          <p className="text-xl text-gray-500 italic">{vocab.pronunciation}</p>

          {/* Type badge */}
          <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {vocab.type}
          </span>

          <button
            onClick={(e) => { e.stopPropagation(); speak(vocab.word); }}
            className="block mx-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            🔊 Hear pronunciation
          </button>
        </div>

        {/* Back (revealed) */}
        {revealed ? (
          <div className="border-t border-gray-100 p-8 space-y-4">
            <div className="text-center">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Meaning</p>
              <p className="text-2xl font-bold text-gray-900">{vocab.meaning}</p>
            </div>
            {vocab.examples && vocab.examples.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Examples</p>
                <ul className="space-y-1">
                  {vocab.examples.map((ex, i) => (
                    <li key={i} className="text-gray-700 text-sm">• {ex}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* SRS info */}
            <div className="flex justify-center gap-4 text-xs text-gray-400">
              <span>Interval: {card.interval}d</span>
              <span>Reps: {card.repetitions}</span>
              <span>Ease: {card.easeFactor.toFixed(1)}</span>
            </div>

            {/* Rating buttons */}
            <div className="space-y-2">
              <p className="text-center text-sm text-gray-500 font-medium">How well did you recall this?</p>
              <div className="grid grid-cols-2 gap-2">
                {QUALITY_LABELS.map(({ q, label, color, hint }) => (
                  <button
                    key={q}
                    onClick={(e) => { e.stopPropagation(); handleReview(q); }}
                    className={`${color} text-white py-3 rounded-xl font-bold text-sm transition-colors`}
                  >
                    <div>{label}</div>
                    <div className="text-xs opacity-80">{hint}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-100 p-6 text-center text-gray-400 text-sm">
            Tap to reveal the meaning
          </div>
        )}
      </div>

      {/* Skip */}
      <button
        onClick={() => handleReview(0)}
        className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
      >
        Mark as "Again" and continue →
      </button>
    </div>
  );
}
