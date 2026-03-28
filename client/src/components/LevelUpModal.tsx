interface LevelUpModalProps {
  newLevel: number;
  onClose: () => void;
}

export default function LevelUpModal({ newLevel, onClose }: LevelUpModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center animate-bounce-once">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-green-700 mb-2">Level Up!</h2>
        <p className="text-gray-600 mb-1">You reached</p>
        <div className="text-5xl font-extrabold text-emerald-600 my-3">Level {newLevel}</div>
        <p className="text-gray-500 text-sm mb-6">Keep practising to unlock more lessons!</p>
        <button
          onClick={onClose}
          className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
        >
          Awesome! 🚀
        </button>
      </div>
    </div>
  );
}
