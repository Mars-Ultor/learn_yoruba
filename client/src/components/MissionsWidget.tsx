import { useState, useEffect } from 'react';
import { missionsApi } from '../services/api';
import type { UserMission } from '../types';

interface MissionsWidgetProps {
  onXpGained?: (xp: number, leveledUp: boolean, newLevel: number) => void;
}

export default function MissionsWidget({ onXpGained }: MissionsWidgetProps) {
  const [missions, setMissions] = useState<UserMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    missionsApi
      .getActive()
      .then((r) => setMissions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const claim = async (id: string) => {
    setClaiming(id);
    try {
      const r = await missionsApi.claim(id);
      const { xpEarned, leveledUp, newLevel } = r.data;
      setMissions((prev) =>
        prev.map((m) => (m.missionId === id ? { ...m, claimedAt: new Date().toISOString() } : m)),
      );
      onXpGained?.(xpEarned, leveledUp, newLevel);
    } catch (e) {
      console.error(e);
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-24 bg-gray-100 rounded-xl" />;
  }

  if (missions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 shadow text-center text-gray-400 text-sm">
        No active missions right now. Check back tomorrow!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-3">
      <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">🎯 Missions</h3>
      {missions.map((um) => {
        const m = um.mission;
        if (!m) return null;
        const pct = Math.min(100, Math.round(((um.progress ?? 0) / m.criteria.target) * 100));
        const claimed = !!um.claimedAt;
        return (
          <div key={um.missionId} className="space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{m.title}</p>
                <p className="text-xs text-gray-400">{m.description}</p>
              </div>
              <div className="ml-2 shrink-0">
                {claimed ? (
                  <span className="text-xs text-green-600 font-semibold">✓ Claimed</span>
                ) : um.completed ? (
                  <button
                    onClick={() => claim(um.missionId)}
                    disabled={claiming === um.missionId}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {claiming === um.missionId ? '…' : `Claim +${m.reward.xp} XP`}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">
                    {um.progress}/{m.criteria.target}
                  </span>
                )}
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
