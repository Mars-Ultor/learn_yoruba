import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi, onboardingApi, tasksApi } from '../services/api';
import OnboardingWizard from '../components/OnboardingWizard';

interface DashboardRecs {
  streak: number;
  totalPoints: number;
  level: number;
  continueLesson?: { id: string; title: string };
  nextLesson?: { id: string; title: string };
  weakAreas: string[];
  dailyGoal?: { targetMinutes: number; completedLessons: number };
  activeMissions: { title: string; progress: number; target: number }[];
}

interface DailyTask {
  id: string;
  type: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
}

export default function Home() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardRecs | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);

  useEffect(() => {
    if (!user) return;
    dashboardApi.getRecs().then((r) => setDashboard(r.data)).catch(console.error);
    onboardingApi.getStatus().then((r) => {
      if (!r.data.onboardingComplete) setShowOnboarding(true);
    }).catch(console.error);
    tasksApi.getDaily().then((r) => setDailyTasks(r.data.tasks ?? [])).catch(console.error);
  }, [user]);

  if (user && dashboard) {
    return (
      <>
        {showOnboarding && (
          <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
        )}
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">E káàbọ̀ 👋</h1>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>🔥 {dashboard.streak} day streak</span>
              <span>⭐ Level {dashboard.level}</span>
              <span>🏅 {dashboard.totalPoints} XP</span>
            </div>
          </div>

          {/* Continue / Next lesson */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard.continueLesson && (
              <Link
                to={`/lessons/${dashboard.continueLesson.id}`}
                className="bg-green-600 text-white rounded-xl p-5 shadow hover:shadow-lg transition-shadow"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-green-200 mb-1">Continue where you left off</p>
                <p className="text-lg font-bold">{dashboard.continueLesson.title}</p>
                <p className="text-green-200 text-sm mt-1">Resume →</p>
              </Link>
            )}
            {dashboard.nextLesson && (
              <Link
                to={`/lessons/${dashboard.nextLesson.id}`}
                className="bg-white rounded-xl p-5 shadow hover:shadow-lg border-2 border-green-200 transition-shadow"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">Next lesson</p>
                <p className="text-lg font-bold text-gray-900">{dashboard.nextLesson.title}</p>
                <p className="text-green-600 text-sm mt-1">Start →</p>
              </Link>
            )}
          </div>

          {/* Daily goal */}
          {dashboard.dailyGoal && (
            <div className="bg-white rounded-xl p-5 shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-800">🎯 Daily Goal</p>
                <p className="text-sm text-gray-500">{dashboard.dailyGoal.completedLessons} / {dashboard.dailyGoal.targetMinutes} min</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (dashboard.dailyGoal.completedLessons / (dashboard.dailyGoal.targetMinutes || 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Daily Tasks */}
          {dailyTasks.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow">
              <h2 className="text-lg font-bold text-gray-900 mb-3">📋 Today's Tasks</h2>
              <div className="space-y-3">
                {dailyTasks.map((task) => {
                  const taskLinks: Record<string, string> = {
                    lesson: '/lessons', flashcard: '/flashcards', quiz: '/quiz',
                    conversation: '/conversation', writing: '/writing', reading: '/reading',
                    drill: '/drill',
                  };
                  const taskTo = taskLinks[task.type] ?? '/lessons';
                  return (
                    <Link key={task.id} to={taskTo} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.completed ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                        {task.completed && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</p>
                        <p className="text-xs text-gray-400">{task.description}</p>
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0">
                        {task.progress}/{task.target}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick practice links */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Practice</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { to: '/quiz', icon: '📝', label: 'Quiz' },
                { to: '/reading', icon: '📖', label: 'Reading' },
                { to: '/writing', icon: '✍️', label: 'Writing' },
                { to: '/tutor', icon: '🤖', label: 'AI Tutor' },
                { to: '/conversation', icon: '💬', label: 'Conversation' },
                { to: '/flashcards', icon: '🃏', label: 'Flashcards' },
                { to: '/drill', icon: '🎯', label: 'Drill' },
                { to: '/schedule', icon: '📅', label: 'Schedule' },
              ].map(({ to, icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="bg-white rounded-xl p-4 shadow text-center hover:shadow-md hover:border-green-300 border border-transparent transition-all"
                >
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-sm font-medium text-gray-700">{label}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Active missions */}
          {dashboard.activeMissions.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow">
              <h2 className="text-lg font-bold text-gray-900 mb-3">🏆 Active Missions</h2>
              <div className="space-y-3">
                {dashboard.activeMissions.slice(0, 3).map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{m.title}</span>
                      <span className="text-gray-500">{m.progress}/{m.target}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/profile" className="block text-center text-sm text-green-600 hover:underline mt-3">View all missions →</Link>
            </div>
          )}

          {/* Weak areas */}
          {dashboard.weakAreas.length > 0 && (
            <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
              <h2 className="text-base font-semibold text-orange-800 mb-1">⚡ Focus areas</h2>
              <p className="text-sm text-orange-700">You could improve: {dashboard.weakAreas.join(', ')}</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // Guest / loading view
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-gray-900">
          Learn Yoruba Through <span className="text-green-600">Conversation</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Master Yoruba like you learned your first language - by speaking from day one.
          Practice real conversations with instant feedback.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/lessons"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Bẹ̀rẹ̀ Ìkẹ́kọ̀ọ́ - Start Learning
          </Link>
          <Link
            to="/vocabulary"
            className="bg-white hover:bg-gray-50 text-green-600 px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-lg border-2 border-green-600"
          >
            Browse Vocabulary
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-3">🗣️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Conversational Practice
          </h3>
          <p className="text-gray-600">
            Learn through real-world Yoruba conversations and scenarios you'll actually use.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-3">🎙️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Speech Recognition
          </h3>
          <p className="text-gray-600">
            Practice pronunciation with instant feedback on your Yoruba speaking.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-3">📈</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Progress Tracking
          </h3>
          <p className="text-gray-600">
            Track your streak, points, and level as you advance through lessons.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-3">📖</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Yoruba Proverbs
          </h3>
          <p className="text-gray-600">
            Discover the rich wisdom of Yoruba culture through traditional proverbs (Òwe).
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Daily Goals
          </h3>
          <p className="text-gray-600">
            Set and achieve daily learning targets to build consistent habits.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-3">🎮</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Gamification
          </h3>
          <p className="text-gray-600">
            Stay motivated with streaks, points, and achievements.
          </p>
        </div>
      </div>

      {/* New features highlight */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Advanced Learning Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/schedule"
            className="group bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl p-7 shadow-xl hover:shadow-2xl transition-shadow space-y-3"
          >
            <div className="text-4xl">📅</div>
            <h3 className="text-xl font-bold">Learning Schedule</h3>
            <p className="text-green-100 text-sm">
              Build a weekly study plan with timed sessions. Get browser reminders so you never miss a day.
            </p>
            <span className="text-xs font-semibold text-green-200 group-hover:text-white transition-colors">
              Set your schedule →
            </span>
          </Link>

          <Link
            to="/drill"
            className="group bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-2xl p-7 shadow-xl hover:shadow-2xl transition-shadow space-y-3"
          >
            <div className="text-4xl">🎯</div>
            <h3 className="text-xl font-bold">Intensive Drill</h3>
            <p className="text-gray-300 text-sm">
              Research-backed high-intensity repetition: 3× consecutive reps, 30s time pressure, 90% accuracy threshold.
            </p>
            <span className="text-xs font-semibold text-gray-400 group-hover:text-white transition-colors">
              Start drill →
            </span>
          </Link>

          <Link
            to="/techniques"
            className="group bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-7 shadow-xl hover:shadow-2xl transition-shadow space-y-3"
          >
            <div className="text-4xl">🧠</div>
            <h3 className="text-xl font-bold">Learning Techniques</h3>
            <p className="text-blue-100 text-sm">
              SRS flashcards, shadowing, mnemonics, storytelling method, and full immersion mode — all in one place.
            </p>
            <span className="text-xs font-semibold text-blue-200 group-hover:text-white transition-colors">
              Explore techniques →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
