import { useState, useEffect } from 'react';
import { vocabularyApi } from '../services/api';
import type { Vocabulary } from '../types';

export default function VocabularyPage() {
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [filter, setFilter] = useState<'all' | 'greetings' | 'nouns' | 'verbs' | 'proverbs'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVocabulary();
  }, [filter]);

  const fetchVocabulary = async () => {
    try {
      setLoading(true);
      const response = filter === 'all'
        ? await vocabularyApi.getAll()
        : await vocabularyApi.getByType(filter);
      setVocabulary(response.data);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-900">Àkójọ Ọ̀rọ̀ - Vocabulary</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('greetings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'greetings'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Greetings
          </button>
          <button
            onClick={() => setFilter('nouns')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'nouns'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Nouns
          </button>
          <button
            onClick={() => setFilter('verbs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'verbs'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Verbs
          </button>
          <button
            onClick={() => setFilter('proverbs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'proverbs'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Proverbs
          </button>
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
    </div>
  );
}
