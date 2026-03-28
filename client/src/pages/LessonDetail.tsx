import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lessonsApi, progressApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { Lesson, Phrase } from '../types';

export default function LessonDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [showEnglish, setShowEnglish] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [showPractice, setShowPractice] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);

  const saveProgress = useCallback(async (completedLesson: Lesson, score: number) => {
    if (!user || progressSaved) return;
    try {
      await progressApi.updateProgress({ userId: user.uid, lessonId: completedLesson.id, score });
      setProgressSaved(true);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [user, progressSaved]);

  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition({
    onResult: (result) => {
      if (lesson) {
        checkPronunciation(result, lesson.phrases[currentPhraseIndex]);
      }
    },
    lang: 'yo',
  });

  useEffect(() => {
    fetchLesson();
  }, [id]);

  useEffect(() => {
    if (user && id) {
      lessonsApi.getUnlocked().then((r) => {
        const ids: string[] = r.data.unlockedIds ?? r.data ?? [];
        // A lesson with no prerequisite is always unlocked
        if (lesson && lesson.prerequisiteId && !ids.includes(id)) {
          setIsLocked(true);
        }
      }).catch(console.error);
    }
  }, [user, id, lesson]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      if (id) {
        const response = await lessonsApi.getById(id);
        setLesson(response.data);
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (lesson && currentPhraseIndex < lesson.phrases.length - 1) {
      setCurrentPhraseIndex(currentPhraseIndex + 1);
      setShowEnglish(false);
    } else if (lesson && currentPhraseIndex === lesson.phrases.length - 1) {
      // Reached the end — save 100% score (user viewed every phrase)
      saveProgress(lesson, 100);
    }
  };

  const handlePrevious = () => {
    if (currentPhraseIndex > 0) {
      setCurrentPhraseIndex(currentPhraseIndex - 1);
      setShowEnglish(false);
    }
  };

  const handleSpeak = (phrase: Phrase) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(phrase.yoruba);
      utterance.lang = 'yo';
      window.speechSynthesis.speak(utterance);
    }
  };

  const checkPronunciation = (spoken: string, expected: Phrase) => {
    const normalizeText = (text: string) => text.replace(/[.,!?]/g, '').toLowerCase().trim();
    const normalizedSpoken = normalizeText(spoken);
    const normalizedExpected = normalizeText(expected.yoruba);

    if (normalizedSpoken === normalizedExpected) {
      setFeedback({ type: 'success', message: 'Ó dára púpọ̀! Perfect pronunciation!' });
      setTimeout(() => {
        if (lesson && currentPhraseIndex === lesson.phrases.length - 1) {
          saveProgress(lesson, 100);
        }
        handleNext();
        setFeedback(null);
        resetTranscript();
      }, 2000);
    } else if (normalizedSpoken.includes(normalizedExpected) || normalizedExpected.includes(normalizedSpoken)) {
      setFeedback({ type: 'info', message: 'Close! Try again. Expected: ' + expected.yoruba });
    } else {
      setFeedback({ type: 'error', message: 'Keep practicing! Expected: ' + expected.yoruba });
    }
  };

  const handleStartPractice = () => {
    setShowPractice(true);
    setFeedback(null);
    resetTranscript();
    startListening();
  };

  const handleStopPractice = () => {
    stopListening();
    setShowPractice(false);
    resetTranscript();
    setFeedback(null);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">Loading lesson...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">Lesson not found</div>
        <Link to="/lessons" className="text-green-600 hover:underline">
          Back to lessons
        </Link>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900">Lesson Locked</h2>
        <p className="text-gray-600">Complete the prerequisite lesson with ≥70% to unlock this lesson.</p>
        <Link to="/lessons" className="inline-block mt-4 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700">
          Back to Lessons
        </Link>
      </div>
    );
  }

  const currentPhrase = lesson.phrases[currentPhraseIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/lessons" className="text-green-600 hover:underline flex items-center gap-2">
          ← Back to lessons
        </Link>
        <div className="text-gray-600">
          Phrase {currentPhraseIndex + 1} of {lesson.phrases.length}
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
        <p className="text-gray-600 mb-6">{lesson.description}</p>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 space-y-6">
          {/* Yoruba */}
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {currentPhrase.yoruba}
            </div>
            <div className="text-2xl text-gray-600 mb-4">
              {currentPhrase.pronunciation}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleSpeak(currentPhrase)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              🔊 Listen
            </button>
            {isSupported && !showPractice && (
              <button
                onClick={handleStartPractice}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                🎙️ Practice Speaking
              </button>
            )}
            {showPractice && (
              <button
                onClick={handleStopPractice}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                ⏹️ Stop
              </button>
            )}
          </div>

          {/* Speech Recognition Feedback */}
          {showPractice && (
            <div className="text-center space-y-3">
              <div className={`p-4 rounded-lg ${isListening ? 'bg-red-100 animate-pulse' : 'bg-gray-100'}`}>
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  {isListening ? '🎤 Listening... Speak now!' : 'Click "Practice Speaking" to start'}
                </div>
                {transcript && (
                  <div className="text-lg text-gray-900">
                    You said: {transcript}
                  </div>
                )}
              </div>
              {feedback && (
                <div className={`p-4 rounded-lg ${
                  feedback.type === 'success' ? 'bg-green-100 text-green-800' :
                  feedback.type === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {feedback.message}
                </div>
              )}
            </div>
          )}
          
          {!isSupported && (
            <div className="text-center p-4 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
              Speech recognition is not supported in your browser. Try Chrome or Edge for the best experience.
            </div>
          )}

          {/* English Translation */}
          <div className="text-center">
            {showEnglish ? (
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-gray-900">
                  {currentPhrase.english}
                </div>
                {currentPhrase.context && (
                  <div className="text-sm text-gray-600 italic max-w-2xl mx-auto">
                    💡 {currentPhrase.context}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowEnglish(true)}
                className="text-green-600 hover:underline font-medium"
              >
                Show English translation
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentPhraseIndex === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              currentPhraseIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentPhraseIndex === lesson.phrases.length - 1}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              currentPhraseIndex === lesson.phrases.length - 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            Next →
          </button>
        </div>
      </div>

      {/* All Phrases */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Phrases in This Lesson</h2>
        <div className="space-y-3">
          {lesson.phrases.map((phrase, index) => (
            <button
              key={phrase.id}
              onClick={() => {
                setCurrentPhraseIndex(index);
                setShowEnglish(false);
              }}
              className={`w-full text-left p-4 rounded-lg transition-colors ${
                index === currentPhraseIndex
                  ? 'bg-green-50 border-2 border-green-600'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="font-semibold text-gray-900">{phrase.yoruba}</div>
              <div className="text-sm text-gray-600">{phrase.pronunciation}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
