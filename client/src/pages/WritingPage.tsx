import { useState, useEffect, useCallback } from 'react';
import { writingApi } from '../services/api';
import LevelUpModal from '../components/LevelUpModal';
import type { WritingSubmission } from '../types';

type Tab = 'practice' | 'history';

export default function WritingPage() {
  const [tab, setTab] = useState<Tab>('practice');
  const [prompt, setPrompt] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ feedback: string; score: number; xpEarned: number; leveledUp: boolean; newLevel: number } | null>(null);
  const [history, setHistory] = useState<WritingSubmission[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [levelUpModal, setLevelUpModal] = useState<number | null>(null);

  const loadPrompt = useCallback(async () => {
    setFeedback(null);
    setText('');
    try {
      const r = await writingApi.getPrompt();
      setPrompt(r.data.prompt ?? r.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadPrompt();
  }, [loadPrompt]);

  useEffect(() => {
    if (tab === 'history') {
      setHistLoading(true);
      writingApi.getHistory().then((r) => {
        setHistory(r.data.submissions ?? r.data ?? []);
      }).catch(console.error).finally(() => setHistLoading(false));
    }
  }, [tab]);

  const submit = async () => {
    if (text.trim().length < 5) return;
    setSubmitting(true);
    try {
      const r = await writingApi.submit({ prompt, response: text });
      setFeedback(r.data);
      if (r.data.leveledUp) setLevelUpModal(r.data.newLevel);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-500';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {levelUpModal && <LevelUpModal newLevel={levelUpModal} onClose={() => setLevelUpModal(null)} />}

      <h1 className="text-3xl font-bold text-gray-900">✍️ Writing Practice</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['practice', 'history'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Practice tab */}
      {tab === 'practice' && (
        <div className="space-y-5">
          {!feedback ? (
            <>
              <div className="bg-purple-50 rounded-xl p-5">
                <p className="text-xs text-purple-500 uppercase font-semibold mb-1">Today's prompt</p>
                <p className="text-gray-800 font-medium">{prompt || 'Loading…'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your response in Yoruba:</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  placeholder="Kọ ìdáhùn rẹ níbí…"
                  className="w-full border border-gray-300 rounded-xl p-4 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none"
                />
                <div className="text-xs text-gray-400 text-right mt-1">{text.length} characters</div>
              </div>
              <button
                onClick={submit}
                disabled={submitting || text.trim().length < 5}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Getting AI feedback…' : 'Submit for Feedback'}
              </button>
            </>
          ) : (
            <div className="space-y-5">
              <div className="bg-white rounded-xl p-6 shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">AI Feedback</h2>
                  <span className={`text-2xl font-bold ${scoreColor(feedback.score)}`}>{feedback.score}/100</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {feedback.feedback}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="bg-purple-50 rounded-lg px-3 py-1.5 inline-block">
                    <span className="text-purple-700 font-semibold">+{feedback.xpEarned} XP earned</span>
                  </div>
                  <button
                    onClick={loadPrompt}
                    className="text-sm text-purple-600 hover:underline"
                  >
                    New prompt →
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Your submission</p>
                <p className="text-gray-700 text-sm">{text}</p>
              </div>
              <button
                onClick={loadPrompt}
                className="w-full border border-purple-600 text-purple-700 py-3 rounded-xl font-semibold hover:bg-purple-50"
              >
                Try Another Prompt
              </button>
            </div>
          )}
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="space-y-4">
          {histLoading && <div className="text-center text-gray-400">Loading…</div>}
          {!histLoading && history.length === 0 && (
            <p className="text-center text-gray-400 py-8">No submissions yet. Start practising!</p>
          )}
          {history.map((sub, idx) => (
            <div key={idx} className="bg-white rounded-xl p-5 shadow">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-gray-400">{new Date(sub.submittedAt || '').toLocaleDateString()}</p>
                <span className={`text-sm font-bold ${scoreColor(sub.score ?? 0)}`}>{sub.score ?? 0}/100</span>
              </div>
              <p className="text-xs text-purple-600 font-medium mb-1">{sub.prompt}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{sub.response}</p>
              {sub.feedback && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">View feedback</summary>
                  <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">{sub.feedback}</p>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
