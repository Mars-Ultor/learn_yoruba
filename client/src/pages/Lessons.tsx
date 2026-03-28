import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lessonsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Lesson } from '../types';

export default function Lessons() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, [filter, page]);

  useEffect(() => {
    if (user) {
      lessonsApi.getUnlocked().then((r) => {
        const ids: string[] = r.data.unlockedIds ?? r.data ?? [];
        setUnlockedIds(new Set(ids));
      }).catch(console.error);
    }
  }, [user]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = filter === 'all'
        ? await lessonsApi.getAll(page, 12)
        : await lessonsApi.getByDifficulty(filter);
      const payload = response.data;
      // Handle both paginated { data, pages } and plain array responses
      if (payload && Array.isArray(payload.data)) {
        setLessons(payload.data);
        setPages(payload.pages ?? 1);
      } else {
        setLessons(Array.isArray(payload) ? payload : []);
        setPages(1);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const isLocked = (lesson: Lesson) => {
    if (!user) return false; // guests see all lessons (locked visually)
    if (!lesson.prerequisiteId) return false; // no prereq = always unlocked
    return !unlockedIds.has(lesson.id);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'conversation':
        return '💬';
      case 'vocabulary':
        return '📖';
      case 'grammar':
        return '📝';
      case 'listening':
        return '👂';
      default:
        return '📚';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-900">Ẹ̀kọ́ - Lessons</h1>
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
            onClick={() => setFilter('beginner')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'beginner'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Beginner
          </button>
          <button
            onClick={() => setFilter('intermediate')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'intermediate'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Intermediate
          </button>
          <button
            onClick={() => setFilter('advanced')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'advanced'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading lessons...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => {
              const locked = isLocked(lesson);
              const card = (
                <div className={`relative bg-white rounded-xl p-6 shadow-lg transition-shadow ${locked ? 'opacity-60' : 'hover:shadow-xl'}`}>
                  {locked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-xl z-10">
                      <span className="text-4xl">🔒</span>
                      <p className="text-sm font-semibold text-gray-600 mt-1">Complete the prerequisite lesson first</p>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{getCategoryIcon(lesson.category)}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(lesson.difficulty)}`}>
                      {lesson.difficulty}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{lesson.title}</h3>
                  <p className="text-gray-600 mb-4">{lesson.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>{lesson.phrases?.length ?? 0} phrases</span>
                  </div>
                </div>
              );
              return locked ? (
                <div key={lesson.id}>{card}</div>
              ) : (
                <Link key={lesson.id} to={`/lessons/${lesson.id}`}>{card}</Link>
              );
            })}
          </div>

          {pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <span className="px-4 py-2 text-sm text-gray-500">{page} / {pages}</span>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
