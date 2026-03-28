import { useState, useEffect } from 'react';
import { readingApi } from '../services/api';
import LevelUpModal from '../components/LevelUpModal';
import type { ReadingExercise } from '../types';

type Stage = 'list' | 'reading' | 'results';

interface ExerciseMeta {
  id: string;
  title: string;
  difficulty: string;
}

export default function ReadingPage() {
  const [stage, setStage] = useState<Stage>('list');
  const [exercises, setExercises] = useState<ExerciseMeta[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState<ReadingExercise | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<{ score: number; correct: number; total: number; xpEarned: number; leveledUp: boolean; newLevel: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [levelUpModal, setLevelUpModal] = useState<number | null>(null);

  useEffect(() => {
    loadList(page);
  }, [page]);

  const loadList = async (p: number) => {
    setLoading(true);
    try {
      const r = await readingApi.getAll(p);
      setExercises(r.data.data ?? r.data);
      setPages(r.data.pages ?? 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openExercise = async (id: string) => {
    setLoading(true);
    try {
      const r = await readingApi.getById(id);
      setSelected(r.data);
      setAnswers({});
      setStage('reading');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswers = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const r = await readingApi.submit(selected.id, answers);
      setResults(r.data);
      if (r.data.leveledUp) setLevelUpModal(r.data.newLevel);
      setStage('results');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor = (d: string) => {
    if (d === 'beginner') return 'bg-green-100 text-green-700';
    if (d === 'intermediate') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {levelUpModal && <LevelUpModal newLevel={levelUpModal} onClose={() => setLevelUpModal(null)} />}

      <h1 className="text-3xl font-bold text-gray-900">📖 Reading Comprehension</h1>

      {/* List */}
      {stage === 'list' && (
        <>
          {loading && <div className="text-center text-gray-400">Loading…</div>}
          <div className="space-y-3">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => openExercise(ex.id)}
                className="w-full text-left bg-white rounded-xl p-4 shadow hover:shadow-md border border-transparent hover:border-blue-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{ex.title}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${difficultyColor(ex.difficulty)}`}>{ex.difficulty}</span>
                </div>
              </button>
            ))}
          </div>
          {pages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40">Prev</button>
              <span className="px-3 py-1 text-sm text-gray-500">{page} / {pages}</span>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}

      {/* Exercise */}
      {stage === 'reading' && selected && (
        <div className="space-y-6">
          <button onClick={() => setStage('list')} className="text-sm text-blue-600 hover:underline">← Back to list</button>
          <div className="bg-blue-50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{selected.title}</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${difficultyColor(selected.difficulty)}`}>{selected.difficulty}</span>
            <p className="mt-4 text-gray-800 leading-relaxed font-yoruba text-base">{selected.passage}</p>
          </div>

          <div className="space-y-5">
            {selected.questions.map((q, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 shadow">
                <p className="font-semibold text-gray-800 mb-3">{idx + 1}. {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswers((prev) => ({ ...prev, [idx]: opt }))}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                        answers[idx] === opt
                          ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={submitAnswers}
            disabled={Object.keys(answers).length < selected.questions.length || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting…' : 'Submit Answers'}
          </button>
        </div>
      )}

      {/* Results */}
      {stage === 'results' && results && selected && (
        <div className="bg-white rounded-xl p-8 shadow-lg text-center space-y-4">
          <div className="text-6xl">{results.score >= 70 ? '🎉' : '📚'}</div>
          <h2 className="text-3xl font-bold text-gray-900">{results.score}%</h2>
          <p className="text-gray-500">{results.correct} / {results.total} correct</p>
          <div className="bg-blue-50 rounded-lg p-3 inline-block">
            <span className="text-blue-700 font-semibold">+{results.xpEarned} XP earned</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => openExercise(selected.id)}
              className="flex-1 border border-blue-600 text-blue-700 py-3 rounded-xl font-semibold hover:bg-blue-50"
            >
              Try Again
            </button>
            <button
              onClick={() => { setStage('list'); setResults(null); }}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
            >
              More Exercises
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
