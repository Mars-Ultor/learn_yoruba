import { useState, useRef, useEffect } from 'react';
import { aiApi } from '../services/api';
import type { ConversationMessage, ConversationSession } from '../types';

type Stage = 'select' | 'chat' | 'summary';

const SCENARIOS = [
  {
    id: 'market',
    label: 'Market Scene',
    icon: '🛒',
    description: 'Practise buying and selling with a market trader',
  },
  {
    id: 'greetings',
    label: 'Greetings',
    icon: '👋',
    description: 'Learn traditional Yoruba greetings with a neighbour',
  },
  {
    id: 'family',
    label: 'Family Talk',
    icon: '👨‍👩‍👧',
    description: 'Discuss family life with a Yoruba elder',
  },
] as const;

type Scenario = (typeof SCENARIOS)[number]['id'];

export default function ConversationPage() {
  const [stage, setStage] = useState<Stage>('select');
  const [sessionId, setSessionId] = useState('');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [pastSessions, setPastSessions] = useState<ConversationSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startConversation = async (sc: Scenario) => {
    setLoading(true);
    setScenario(sc);
    try {
      const r = await aiApi.startConversation(sc);
      setSessionId(r.data.sessionId);
      setMessages([{ role: 'assistant', content: r.data.opening }]);
      setStage('chat');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: ConversationMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const r = await aiApi.sendConversationMessage(sessionId, text);
      setMessages([...nextMessages, { role: 'assistant', content: r.data.reply }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const endConversation = async () => {
    setLoading(true);
    try {
      const r = await aiApi.endConversation(sessionId);
      setSummary(r.data.summary);
      setStage('summary');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const r = await aiApi.getConversationSessions();
      setPastSessions(r.data.sessions ?? r.data ?? []);
      setShowHistory(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scenarioLabel = SCENARIOS.find((s) => s.id === scenario)?.label ?? '';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💬 Conversation Practice</h1>
          <p className="text-sm text-gray-500 mt-1">Practise speaking Yoruba in realistic scenarios</p>
        </div>
        {stage === 'select' && (
          <button onClick={loadHistory} className="text-sm text-blue-600 hover:underline">Session history</button>
        )}
      </div>

      {/* Scenario select */}
      {stage === 'select' && !showHistory && (
        <div className="space-y-3">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => startConversation(sc.id)}
              disabled={loading}
              className="w-full text-left bg-white rounded-xl p-5 shadow hover:shadow-md border border-transparent hover:border-orange-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{sc.icon}</span>
                <div>
                  <div className="font-semibold text-gray-800">{sc.label}</div>
                  <div className="text-sm text-gray-500">{sc.description}</div>
                </div>
              </div>
            </button>
          ))}
          {loading && <div className="text-center text-gray-400">Starting…</div>}
        </div>
      )}

      {/* History */}
      {stage === 'select' && showHistory && (
        <div className="space-y-3">
          <button onClick={() => setShowHistory(false)} className="text-sm text-blue-600 hover:underline">← Back</button>
          {pastSessions.length === 0 && <p className="text-gray-400 text-center py-8">No past sessions yet.</p>}
          {pastSessions.map((s) => (
            <div key={s.id} className="bg-white rounded-xl p-4 shadow">
              <div className="flex justify-between items-start">
                <span className="font-medium capitalize text-gray-800">{s.topic}</span>
                <span className="text-xs text-gray-400">{new Date(s.startedAt || '').toLocaleDateString()}</span>
              </div>
              {s.summary && <p className="text-sm text-gray-600 mt-1">{s.summary}</p>}
              <p className="text-xs text-gray-400 mt-1">{s.messageCount ?? 0} messages</p>
            </div>
          ))}
        </div>
      )}

      {/* Chat */}
      {stage === 'chat' && (
        <div className="flex flex-col h-[calc(100vh-16rem)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">{scenarioLabel}</span>
            <button
              onClick={endConversation}
              disabled={loading}
              className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-lg hover:bg-orange-200 disabled:opacity-50"
            >
              End & Get Summary
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0 mt-1">AI</div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0">AI</div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={2}
                placeholder="Type your response… (Enter to send)"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm resize-none focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {stage === 'summary' && (
        <div className="bg-white rounded-xl p-8 shadow-lg space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-2">🏆</div>
            <h2 className="text-2xl font-bold text-gray-900">Conversation Complete!</h2>
            <p className="text-gray-500 text-sm mt-1">{scenarioLabel}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-5">
            <p className="text-xs text-orange-600 uppercase font-semibold mb-2">AI Summary</p>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
          </div>
          <button
            onClick={() => { setStage('select'); setMessages([]); setSummary(''); setShowHistory(false); }}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600"
          >
            Start New Conversation
          </button>
        </div>
      )}
    </div>
  );
}
