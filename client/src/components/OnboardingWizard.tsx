import { useState } from 'react';
import { onboardingApi } from '../services/api';
import type { LearningStyleOption } from '../types';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STYLES: { value: LearningStyleOption; label: string; description: string; icon: string }[] = [
  { value: 'standard', label: 'Standard', description: 'Balanced lessons and review', icon: '📚' },
  { value: 'intensive', label: 'Intensive', description: 'Deep drills with repetition', icon: '🔥' },
  { value: 'story', label: 'Story Mode', description: 'Learn through Yoruba stories', icon: '📖' },
  { value: 'immersion', label: 'Immersion', description: 'Fully immersive Yoruba experience', icon: '🌍' },
];

const GOALS = [15, 30, 45, 60];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [style, setStyle] = useState<LearningStyleOption>('standard');
  const [goalMinutes, setGoalMinutes] = useState(15);
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    setSaving(true);
    try {
      await onboardingApi.complete({ learningStyle: style, dailyGoalMinutes: goalMinutes });
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {step === 0 && (
            <div>
              <div className="text-4xl mb-3 text-center">🇳🇬</div>
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">
                Welcome to Ẹ̀kọ́ Yorùbá!
              </h2>
              <p className="text-gray-500 text-center text-sm mb-6">
                Let's personalise your learning experience.
              </p>
              <h3 className="font-semibold text-gray-700 mb-3">How do you like to learn?</h3>
              <div className="grid grid-cols-2 gap-3">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                      style === s.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <span className="text-2xl mb-1">{s.icon}</span>
                    <span className="font-medium text-sm text-gray-800">{s.label}</span>
                    <span className="text-xs text-gray-400 text-center mt-0.5">{s.description}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="w-full mt-6 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Next →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="text-4xl mb-3 text-center">🎯</div>
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">
                Set your daily goal
              </h2>
              <p className="text-gray-500 text-center text-sm mb-6">
                How many minutes can you practice each day?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoalMinutes(g)}
                    className={`py-4 rounded-xl border-2 font-bold text-lg transition-all ${
                      goalMinutes === g
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-green-300'
                    }`}
                  >
                    {g} min
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-4xl mb-3 text-center">🚀</div>
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">
                You're all set!
              </h2>
              <p className="text-gray-500 text-center text-sm mb-6">
                Here's your learning plan:
              </p>
              <div className="bg-green-50 rounded-xl p-4 space-y-3 mb-6">
                {STYLES.filter((s) => s.value === style).map((s) => (
                  <div key={s.value} className="flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{s.label} mode</p>
                      <p className="text-xs text-gray-500">{s.description}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏱️</span>
                  <div>
                    <p className="font-semibold text-gray-800">{goalMinutes} minutes/day</p>
                    <p className="text-xs text-gray-500">Daily practice goal</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : 'Start Learning! 🎉'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
