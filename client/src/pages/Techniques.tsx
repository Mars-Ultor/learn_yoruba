import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { settingsApi } from '../services/api';
import type { UserSettings, LearningStyle } from '../types';

// ─── Technique metadata ───────────────────────────────────────────────────────
interface TechniqueCard {
  key: keyof UserSettings | 'intensiveDrill';
  label: string;
  icon: string;
  description: string;
  detail: string;
  link?: string;
  isStyle?: boolean;
  styleValue?: LearningStyle;
  settingKey?: keyof Pick<UserSettings, 'flashcardMode' | 'shadowingMode' | 'mnemonicMode' | 'storyMode'>;
}

const TECHNIQUES: TechniqueCard[] = [
  {
    key: 'intensiveDrill',
    label: 'Intensive Repetition',
    icon: '🎯',
    description: 'High-intensity repetition drill with strict accuracy gates and time pressure to build durable pronunciation habits.',
    detail: `Research in motor learning and language acquisition shows that massed repetition with immediate feedback produces faster retention than spaced review alone. This drill requires you to say each phrase correctly 3 consecutive times before advancing, respond within 30 seconds per attempt, and sustain 90%+ accuracy across the session. The time constraint keeps attention high and prevents rote mumbling — you must actively recall and produce each phrase under mild pressure.`,
    link: '/drill',
  },
  {
    key: 'flashcardMode',
    label: 'Spaced Repetition (SRS)',
    icon: '🃏',
    description: 'Review vocabulary at scientifically optimised intervals to move words into long-term memory.',
    detail: `The SM-2 algorithm (used by Anki) schedules each card for review just before you would forget it. Cards you find easy are shown less frequently; difficult cards come back sooner. Research shows this is 2-3× more efficient than re-reading. After each card you rate it: Again / Hard / Good / Easy — the system adapts accordingly.`,
    link: '/flashcards',
    settingKey: 'flashcardMode',
  },
  {
    key: 'shadowingMode',
    label: 'Shadowing',
    icon: '🔊',
    description: 'Listen to a native utterance and repeat it simultaneously — the fastest path to natural speech rhythm.',
    detail: `Developed by Alexander Arguelles, shadowing means speaking along with audio in real-time, matching rhythm, stress, and intonation exactly. It trains your mouth muscles and your ear simultaneously. In lesson practice mode, press "Hear pronunciation" then immediately repeat — do not wait for the audio to finish. Aim to overlap with the speaker.`,
    settingKey: 'shadowingMode',
  },
  {
    key: 'mnemonicMode',
    label: 'Mnemonic Associations',
    icon: '🧠',
    description: 'Create vivid mental images that link Yoruba sounds to their meanings — unforgettable recall.',
    detail: `The keyword method: find an English word that sounds similar to the Yoruba word, then create an absurd mental image connecting that word to the meaning. E.g. "Ilé" (house) → sounds like "ill-ay" → imagine a house that feels ill (sick). The more bizarre the image, the better. This leverages visual memory, which is far stronger than rote repetition.`,
    settingKey: 'mnemonicMode',
  },
  {
    key: 'storyMode',
    label: 'Storytelling / Narrative',
    icon: '📖',
    description: 'Embed vocabulary into connected stories — context makes language stick far better than isolated words.',
    detail: `The TPRS (Teaching Proficiency through Reading and Storytelling) method embeds target words into compelling, personalized narratives. When you encounter "Jẹun" (eat food) in the story of a character going to Lagos market, its meaning becomes anchored to that scene. Activate this mode to see Yoruba vocabulary inside short narrative passages in lessons.`,
    settingKey: 'storyMode',
  },
  {
    key: 'learningStyle',
    label: 'Immersion Mode',
    icon: '🌍',
    description: 'Set the app interface to full Yoruba — no English translations unless you ask for them.',
    detail: `Full immersion forces your brain to derive meaning from context rather than translation. The app will use Yoruba labels, prompts, and instructions throughout. You can toggle individual translations on demand. This mirrors the environment you would have if you moved to Yorubaland — your brain adapts faster when English is not a crutch.`,
    isStyle: true,
    styleValue: 'immersion',
  },
];

export default function Techniques() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    settingsApi.getByUser(user.uid).then((r) => {
      setSettings(r.data);
      setLoading(false);
    });
  }, [user]);

  const toggleSetting = async (key: keyof Pick<UserSettings, 'flashcardMode' | 'shadowingMode' | 'mnemonicMode' | 'storyMode'>) => {
    if (!settings || !user) return;
    const newVal = !settings[key];
    setSaving(key);
    try {
      const res = await settingsApi.update(user.uid, { [key]: newVal });
      setSettings(res.data);
    } finally {
      setSaving(null);
    }
  };

  const setLStyle = async (style: LearningStyle) => {
    if (!user) return;
    setSaving('learningStyle');
    try {
      const res = await settingsApi.update(user.uid, { learningStyle: style });
      setSettings(res.data);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading techniques…</div>;
  }

  const isImmersion = settings?.learningStyle === 'immersion';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Ọ̀nà Ìkẹ́kọ̀ọ́ — Learning Techniques</h1>
        <p className="text-gray-600 mt-2">
          Choose the methods that fit your learning style. Multiple techniques can be active simultaneously.
        </p>
      </div>

      {/* Active learning style */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="font-bold text-gray-900 mb-4">Active Learning Style</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['standard', 'intensive', 'story', 'immersion'] as LearningStyle[]).map((style) => {
            const labels: Record<LearningStyle, string> = {
              standard: '📚 Standard',
              intensive: '🔥 Intensive',
              story: '📖 Story',
              immersion: '🌍 Immersion',
            };
            const active = settings?.learningStyle === style;
            return (
              <button
                key={style}
                onClick={() => setLStyle(style)}
                disabled={saving === 'learningStyle'}
                className={`py-2.5 px-4 rounded-xl font-semibold text-sm border-2 transition-colors ${
                  active
                    ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-200 text-gray-600 hover:border-green-400'
                }`}
              >
                {labels[style]}
              </button>
            );
          })}
        </div>
        {isImmersion && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 text-sm">
            <strong>Immersion mode active</strong> — the app will prefer Yoruba labels and prompts wherever possible.
          </div>
        )}
      </div>

      {/* Technique cards */}
      <div className="space-y-4">
        {TECHNIQUES.map((t) => {
          let isActive = false;
          const isSaving = saving === t.settingKey || saving === 'learningStyle';

          if (t.settingKey) {
            isActive = !!settings?.[t.settingKey];
          } else if (t.isStyle && t.styleValue) {
            isActive = settings?.learningStyle === t.styleValue;
          } else if (t.key === 'intensiveDrill') {
            isActive = settings?.learningStyle === 'intensive';
          }

          return (
            <div
              key={String(t.key)}
              className={`bg-white rounded-xl shadow border-2 transition-colors ${
                isActive ? 'border-green-400' : 'border-transparent'
              }`}
            >
              {/* Card header */}
              <div className="p-5 flex items-start gap-4">
                <div className="text-4xl flex-shrink-0">{t.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-lg">{t.label}</h3>
                    {isActive && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{t.description}</p>
                </div>

                {/* Toggle / action */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {t.settingKey ? (
                    <button
                      onClick={() => toggleSetting(t.settingKey!)}
                      disabled={isSaving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        isActive ? 'bg-green-500' : 'bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  ) : t.isStyle && t.styleValue ? (
                    <button
                      onClick={() => setLStyle(isActive ? 'standard' : t.styleValue!)}
                      disabled={isSaving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        isActive ? 'bg-green-500' : 'bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  ) : null}

                  {t.link && (
                    <Link
                      to={t.link}
                      className="text-xs font-semibold text-green-700 hover:text-green-900 underline underline-offset-2"
                    >
                      Open →
                    </Link>
                  )}

                  <button
                    onClick={() => setExpanded(expanded === String(t.key) ? null : String(t.key))}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    {expanded === String(t.key) ? 'Less ▲' : 'How it works ▼'}
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === String(t.key) && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{t.detail}</p>
                  {t.link && (
                    <Link
                      to={t.link}
                      className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors"
                    >
                      Start practising →
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Daily reminders toggle */}
      <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-900">Daily Reminders</h3>
          <p className="text-gray-500 text-sm">Receive a browser notification each day to keep your streak alive.</p>
        </div>
        <button
          onClick={async () => {
            if (!user) return;
            if (!settings?.dailyReminders && 'Notification' in window) {
              await Notification.requestPermission();
            }
            setSaving('dailyReminders');
            const res = await settingsApi.update(user.uid, { dailyReminders: !settings?.dailyReminders });
            setSettings(res.data);
            setSaving(null);
          }}
          disabled={saving === 'dailyReminders'}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            settings?.dailyReminders ? 'bg-green-500' : 'bg-gray-300'
          } disabled:opacity-50`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings?.dailyReminders ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/drill', icon: '🔥', label: 'Intensive Drill', sub: 'Strict repetition protocol' },
          { to: '/flashcards', icon: '🃏', label: 'Flashcards', sub: 'SRS vocabulary review' },
          { to: '/schedule', icon: '📅', label: 'Schedule', sub: 'Build your study rhythm' },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-white rounded-xl shadow hover:shadow-md p-5 flex items-center gap-4 transition-shadow group"
          >
            <div className="text-3xl">{link.icon}</div>
            <div>
              <p className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{link.label}</p>
              <p className="text-gray-500 text-sm">{link.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
