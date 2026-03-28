import { useState, useEffect } from 'react';
import { vocabularyApi } from '../services/api';
import type { Vocabulary } from '../types';

export default function VocabularyPage() {
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [filter, setFilter] = useState<'all' | 'greetings' | 'nouns' | 'verbs' | 'proverbs' | 'adjectives' | 'adverbs' | 'numbers' | 'expressions'>('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVocabulary();
  }, [filter, page]);

  const fetchVocabulary = async () => {
    try {
      setLoading(true);
      const response = filter === 'all'
        ? await vocabularyApi.getAll(page, 18)
        : await vocabularyApi.getByType(filter);
      const payload = response.data;
      if (payload && Array.isArray(payload.data)) {
        setVocabulary(payload.data);
        setPages(payload.pages ?? 1);
      } else {
        setVocabulary(Array.isArray(payload) ? payload : []);
        setPages(1);
      }
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'greetings':
        return 'bg-green-100 text-green-800';
      case 'nouns':
        return 'bg-blue-100 text-blue-800';
      case 'verbs':
        return 'bg-purple-100 text-purple-800';
      case 'proverbs':
        return 'bg-amber-100 text-amber-800';
      case 'adjectives':
        return 'bg-pink-100 text-pink-800';
      case 'adverbs':
        return 'bg-cyan-100 text-cyan-800';
      case 'numbers':
        return 'bg-indigo-100 text-indigo-800';
      case 'expressions':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSpeak = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'yo';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Static class map — dynamic strings like `bg-${color}-600` are purged by Tailwind JIT
  const activeClass: Record<string, string> = {
    all:         'bg-green-600 text-white',
    greetings:   'bg-green-600 text-white',
    nouns:       'bg-blue-600 text-white',
    verbs:       'bg-purple-600 text-white',
    adjectives:  'bg-pink-600 text-white',
    adverbs:     'bg-cyan-600 text-white',
    numbers:     'bg-indigo-600 text-white',
    proverbs:    'bg-amber-600 text-white',
    expressions: 'bg-orange-600 text-white',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-900">Àkójọ Ọ̀rọ̀ - Vocabulary</h1>
        <div className="flex gap-2 flex-wrap justify-end">
          {([
            { key: 'all',         label: 'All' },
            { key: 'greetings',   label: 'Greetings' },
            { key: 'nouns',       label: 'Nouns' },
            { key: 'verbs',       label: 'Verbs' },
            { key: 'adjectives',  label: 'Adjectives' },
            { key: 'adverbs',     label: 'Adverbs' },
            { key: 'numbers',     label: 'Numbers' },
            { key: 'proverbs',    label: 'Proverbs' },
            { key: 'expressions', label: 'Expressions' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === key
                  ? activeClass[key]
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading vocabulary...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vocabulary.map((vocab) => (
            <div
              key={vocab.id}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl font-bold">{vocab.word}</div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(vocab.type)}`}>
                  {vocab.type}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="text-xl text-gray-700">{vocab.pronunciation}</div>
                <div className="text-lg font-semibold text-gray-900">{vocab.meaning}</div>
              </div>

              {vocab.examples.length > 0 && (
                <div className="mt-4 space-y-1">
                  <div className="text-sm font-semibold text-gray-700">Examples:</div>
                  {vocab.examples.map((example, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {example}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleSpeak(vocab.word)}
                className="mt-4 w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                🔊 Listen
              </button>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">← Prev</button>
          <span className="px-4 py-2 text-sm text-gray-500">{page} / {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">Next →</button>
        </div>
      )}
    </div>
  );
}
