import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersApi, progressApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import MissionsWidget from '../components/MissionsWidget';
import LevelUpModal from '../components/LevelUpModal';
import type { User, UserProgress, DailyGoal } from '../types';
import { XP_THRESHOLDS } from '../types';

export default function Profile() {
  const { user: authUser, lastCheckIn } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelUpModal, setLevelUpModal] = useState<number | null>(null);
  const [streakResetBanner, setStreakResetBanner] = useState(false);

  useEffect(() => {
    if (lastCheckIn?.streakReset) setStreakResetBanner(true);
  }, [lastCheckIn]);

  useEffect(() => {
    if (authUser) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [authUser]);

  const fetchUserData = async () => {
    if (!authUser) return;
    try {
      setLoading(true);
      const [userRes, progressRes, goalRes] = await Promise.all([
        usersApi.getProfile(authUser.uid),
        progressApi.getUserProgress(authUser.uid),
        progressApi.getDailyGoals(authUser.uid),
      ]);
      setUser(userRes.data);
      setProgress(progressRes.data);
      setDailyGoal(goalRes.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">Please log in to view your profile</div>
        <Link to="/login" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">User profile not found</div>
      </div>
    );
  }

  const completedLessons = progress.filter(p => p.completed).length;
  const averageScore = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.score, 0) / progress.length)
    : 0;

  const maxLevel = XP_THRESHOLDS.length - 1;
  const currentLevelXp = XP_THRESHOLDS[Math.min(user.level, maxLevel)] ?? 0;
  const nextLevelXp = XP_THRESHOLDS[Math.min(user.level + 1, maxLevel)] ?? currentLevelXp;
  const xpInLevel = user.totalPoints - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const xpPct = xpNeeded > 0 ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;

  return (
    <div className="space-y-6">
      {levelUpModal && (
        <LevelUpModal newLevel={levelUpModal} onClose={() => setLevelUpModal(null)} />
      )}

      {streakResetBanner && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-orange-700 text-sm">
            😢 Your streak was reset. Start today to build it back up!
          </span>
          <button onClick={() => setStreakResetBanner(false)} className="text-orange-400 hover:text-orange-600 text-xl leading-none">✕</button>
        </div>
      )}

      <h1 className="text-4xl font-bold text-gray-900">Profile</h1>

      {/* User Info Card */}
      <div className="bg-white rounded-xl p-8 shadow-lg">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-4xl text-white font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex gap-4 mt-2 flex-wrap">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                Level {user.level}
              </span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                {user.totalPoints} XP
              </span>
            </div>
            {/* XP progress to next level */}
            {user.level < maxLevel && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Level {user.level}</span>
                  <span>{xpInLevel} / {xpNeeded} XP to Level {user.level + 1}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-2">🔥</div>
          <div className="text-3xl font-bold text-gray-900">{user.streak}</div>
          <div className="text-gray-600">Day Streak</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-3xl font-bold text-gray-900">{completedLessons}</div>
          <div className="text-gray-600">Lessons Completed</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-2">⭐</div>
          <div className="text-3xl font-bold text-gray-900">{user.totalPoints}</div>
          <div className="text-gray-600">Total XP</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-3xl font-bold text-gray-900">{averageScore}%</div>
          <div className="text-gray-600">Average Score</div>
        </div>
      </div>

      {/* Missions */}
      <MissionsWidget
        onXpGained={(xp, leveledUp, newLevel) => {
          setUser((u) => u ? { ...u, totalPoints: u.totalPoints + xp } : u);
          if (leveledUp) setLevelUpModal(newLevel);
        }}
      />

      {/* Daily Goal */}
      {dailyGoal && (
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Goal</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Practice Time</span>
                <span className="font-semibold">
                  {dailyGoal.completedMinutes} / {dailyGoal.targetMinutes} minutes
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min((dailyGoal.completedMinutes / dailyGoal.targetMinutes) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Lessons Completed</span>
                <span className="font-semibold">
                  {dailyGoal.completedLessons} / {dailyGoal.targetLessons} lessons
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-emerald-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min((dailyGoal.completedLessons / dailyGoal.targetLessons) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Progress */}
      <div className="bg-white rounded-xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Progress</h2>
        {progress.length === 0 ? (
          <p className="text-gray-600">No lessons completed yet. Start learning!</p>
        ) : (
          <div className="space-y-3">
            {progress.map((p) => (
              <div
                key={`${p.lessonId}-${p.lastAttemptDate}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    {(p as any).lesson?.title ?? `Lesson ${p.lessonId}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {p.attempts} {p.attempts === 1 ? 'attempt' : 'attempts'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{p.score}%</div>
                  {p.completed && (
                    <div className="text-sm text-green-600 font-semibold">Completed ✓</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

