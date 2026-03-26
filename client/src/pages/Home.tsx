import { Link } from 'react-router-dom';

export default function Home() {
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
    </div>
  );
}
