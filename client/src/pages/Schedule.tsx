import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { scheduleApi } from '../services/api';
import type { LearningSchedule } from '../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

function getNextOccurrenceDate(dayOfWeek: number, startTime: string): Date {
  const now = new Date();
  const [h, mi] = startTime.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, mi, 0, 0);
  let diff = dayOfWeek - now.getDay();
  if (diff < 0 || (diff === 0 && target <= now)) diff += 7;
  target.setDate(target.getDate() + diff);
  return target;
}

function getNextOccurrence(dayOfWeek: number, startTime: string): string {
  const target = getNextOccurrenceDate(dayOfWeek, startTime);
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  return target.toLocaleDateString('en-US', opts);
}

export default function Schedule() {
  const { user } = useAuth();

  const [schedules, setSchedules] = useState<LearningSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // New session form state
  const [newDay, setNewDay] = useState(1);
  const [newTime, setNewTime] = useState('07:00');
  const [newDuration, setNewDuration] = useState(30);

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    fetchSchedules();
    if ('Notification' in window) setNotifPermission(Notification.permission);
  }, [user]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await scheduleApi.getByUser(user!.uid);
      setSchedules(res.data);
    } catch {
      // silent — user may not have any entries yet
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await scheduleApi.create({ userId: user.uid, dayOfWeek: newDay, startTime: newTime, duration: newDuration });
      setShowForm(false);
      fetchSchedules();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (entry: LearningSchedule) => {
    await scheduleApi.update(entry.id, { active: !entry.active });
    setSchedules((prev) => prev.map((s) => s.id === entry.id ? { ...s, active: !s.active } : s));
  };

  const handleDelete = async (id: string) => {
    await scheduleApi.remove(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const requestNotifications = useCallback(async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  }, []);

  const schedulesByDay = DAYS.map((_, idx) =>
    schedules.filter((s) => s.dayOfWeek === idx).sort((a, b) => a.startTime.localeCompare(b.startTime))
  );

  // Upcoming sessions (next 3)
  const upcomingSessions = [...schedules]
    .filter((s) => s.active)
    .map((s) => ({ ...s, next: getNextOccurrence(s.dayOfWeek, s.startTime), nextTs: getNextOccurrenceDate(s.dayOfWeek, s.startTime).getTime() }))
    .sort((a, b) => a.nextTs - b.nextTs)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Àkókò Ìkẹ́kọ̀ọ́ — Learning Schedule</h1>
          <p className="text-gray-600 mt-1">Plan your weekly Yoruba study sessions and build a consistent habit.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow"
        >
          + Add Session
        </button>
      </div>

      {/* Notification banner */}
      {notifPermission !== 'granted' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-yellow-800">Enable reminders</p>
            <p className="text-yellow-700 text-sm">Get browser notifications when a scheduled session is about to begin.</p>
          </div>
          <button
            onClick={requestNotifications}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {/* Upcoming sessions */}
      {upcomingSessions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Sessions</h2>
          <div className="space-y-3">
            {upcomingSessions.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                <div className="text-2xl">📅</div>
                <div>
                  <p className="font-semibold text-gray-900">{s.next}</p>
                  <p className="text-sm text-gray-600">{s.duration} min session</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading schedule…</div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-gray-100">
            {DAYS.map((day, idx) => (
              <div key={day} className="flex flex-col">
                {/* Day header */}
                <div className={`p-3 text-center font-bold text-sm ${idx >= 1 && idx <= 5 ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-500'}`}>
                  <span className="hidden sm:block">{day}</span>
                  <span className="sm:hidden">{DAY_SHORT[idx]}</span>
                </div>
                {/* Session entries */}
                <div className="p-2 space-y-2 min-h-[120px]">
                  {schedulesByDay[idx].map((s) => (
                    <div
                      key={s.id}
                      className={`rounded-lg p-2 text-xs relative group cursor-default ${s.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400 line-through'}`}
                    >
                      <div className="font-bold">{formatTime(s.startTime)}</div>
                      <div>{s.duration}m</div>
                      {/* Actions on hover */}
                      <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                        <button
                          onClick={() => handleToggleActive(s)}
                          title={s.active ? 'Pause' : 'Activate'}
                          className="text-gray-500 hover:text-green-700"
                        >
                          {s.active ? '⏸' : '▶'}
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          title="Delete"
                          className="text-gray-500 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add session form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">New Study Session</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Day of Week</label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {TIME_SLOTS.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Duration: {newDuration} min</label>
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={5}
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full accent-green-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>10 min</span><span>120 min</span></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors"
              >
                {saving ? 'Saving…' : 'Add Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && schedules.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <div className="text-6xl">📅</div>
          <h3 className="text-xl font-bold text-gray-700">No sessions yet</h3>
          <p className="text-gray-500">Add your first study session to build a consistent learning routine.</p>
          <button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Add Your First Session
          </button>
        </div>
      )}
    </div>
  );
}
