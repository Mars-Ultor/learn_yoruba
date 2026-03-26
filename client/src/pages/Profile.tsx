import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersApi, progressApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { User, UserProgress, DailyGoal } from '../types';

export default function Profile() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [loading, setLoading] = useState(true);

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
      const userResponse = await usersApi.getProfile(authUser.uid);
      setUser(userResponse.data);

      const progressResponse = await progressApi.getUserProgress(authUser.uid);
      setProgress(progressResponse.data);

      const goalResponse = await progressApi.getDailyGoals(authUser.uid);
      setDailyGoal(goalResponse.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">Loading profile...</div>
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

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Profile</h1>

      {/* User Info Card */}
      <div className="bg-white rounded-xl p-8 shadow-lg">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-4xl text-white font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex gap-4 mt-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                Level {user.level}
              </span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                {user.totalPoints} Points
              </span>
            </div>
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
          <div className="text-gray-600">Total Points</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-3xl font-bold text-gray-900">{averageScore}%</div>
          <div className="text-gray-600">Average Score</div>
        </div>
      </div>

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
                  <div className="font-semibold text-gray-900">Lesson {p.lessonId}</div>
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
