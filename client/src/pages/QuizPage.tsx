import { useState, useEffect } from 'react';
import { lessonsApi, quizApi } from '../services/api';
import LevelUpModal from '../components/LevelUpModal';
import type { QuizQuestion } from '../types';

type Stage = 'select' | 'quiz' | 'results';

interface LessonMeta {
  id: string;
  title: string;
  difficulty: string;
}

export default function QuizPage() {
  const [stage, setStage] = useState<Stage>('select');
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonMeta | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{ score: number; correct: number; total: number; xpEarned: number; leveledUp: boolean; newLevel: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [levelUpModal, setLevelUpModal] = useState<number | null>(null);

  useEffect(() => {
    lessonsApi.getAll(1, 50).then((r) => {
      const data = r.data.data ?? r.data;
      setLessons(Array.isArray(data) ? data : []);
    }).catch(console.error);
  }, []);

  const startQuiz = async (lesson: LessonMeta) => {
    setLoading(true);
    setSelectedLesson(lesson);
    try {
      const r = await quizApi.generate(lesson.id);
      setQuestions(r.data.questions);
      setAnswers({});
      setStage('quiz');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!selectedLesson) return;
    setLoading(true);
    try {
      const r = await quizApi.submit({ lessonId: selectedLesson.id, questions, answers });
      setResults(r.data);
      if (r.data.leveledUp) setLevelUpModal(r.data.newLevel);
      setStage('results');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {levelUpModal && <LevelUpModal newLevel={levelUpModal} onClose={() => setLevelUpModal(null)} />}

      <h1 className="text-3xl font-bold text-gray-900">📝 Quiz</h1>

      {/* Stage: select lesson */}
      {stage === 'select' && (
        <div className="space-y-3">
          <p className="text-gray-500">Choose a lesson to be quizzed on:</p>
          {lessons.map((l) => (
            <button
              key={l.id}
              onClick={() => startQuiz(l)}
              disabled={loading}
              className="w-full text-left bg-white rounded-xl p-4 shadow hover:shadow-md border border-transparent hover:border-green-300 transition-all"
            >
              <div className="font-semibold text-gray-800">{l.title}</div>
              <div className="text-xs text-gray-400 capitalize mt-0.5">{l.difficulty}</div>
            </button>
          ))}
          {loading && <div className="text-center text-gray-400">Generating quiz…</div>}
        </div>
      )}

      {/* Stage: quiz questions */}
      {stage === 'quiz' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 font-medium">{selectedLesson?.title}</p>
            <span className="text-sm text-gray-400">{answeredCount}/{questions.length} answered</span>
          </div>

          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl p-6 shadow">
              <p className="text-xs text-gray-400 uppercase mb-2">Question {idx + 1} · {q.type.replace('-', ' ')}</p>
              <p className="font-semibold text-gray-800 mb-4">
                {q.type === 'multiple-choice' && (
                  <>What does <span className="text-green-700">"{q.yoruba}"</span> mean?</>
                )}
                {q.type === 'fill-blank' && (
                  <>How do you say <span className="text-blue-700">"{q.english}"</span> in Yoruba?</>
                )}
                {q.type === 'tone-match' && (
                  <>Select the correct pronunciation of <span className="text-purple-700">"{q.yoruba}"</span>:</>
                )}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {(q.options ?? []).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                    className={`text-left px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                      answers[q.id] === opt
                        ? 'border-green-500 bg-green-50 text-green-800 font-medium'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={submitQuiz}
            disabled={answeredCount < questions.length || loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Grading…' : `Submit Quiz (${answeredCount}/${questions.length})`}
          </button>
        </div>
      )}

      {/* Stage: results */}
      {stage === 'results' && results && (
        <div className="bg-white rounded-xl p-8 shadow-lg text-center space-y-4">
          <div className="text-6xl">{results.score >= 70 ? '🎉' : '📚'}</div>
          <h2 className="text-3xl font-bold text-gray-900">{results.score}%</h2>
          <p className="text-gray-500">
            {results.correct} / {results.total} correct
          </p>
          <div className="bg-green-50 rounded-lg p-3 inline-block">
            <span className="text-green-700 font-semibold">+{results.xpEarned} XP earned</span>
          </div>
          {results.score >= 70 ? (
            <p className="text-green-600 font-medium">Great job! Lesson passed ✓</p>
          ) : (
            <p className="text-orange-500">Score below 70% — keep practising!</p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => selectedLesson && startQuiz(selectedLesson)}
              className="flex-1 border border-green-600 text-green-700 py-3 rounded-xl font-semibold hover:bg-green-50"
            >
              Retry Quiz
            </button>
            <button
              onClick={() => { setStage('select'); setResults(null); }}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700"
            >
              Choose Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
