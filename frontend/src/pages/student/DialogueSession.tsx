import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import type { DialogueMessage } from '../../types';

export default function DialogueSession() {
  const { answerId } = useParams<{ answerId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [dialogueComplete, setDialogueComplete] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDialogue();
  }, [answerId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDialogue = async () => {
    try {
      setError('');
      const res = await api.get(`/answers/${answerId}/dialogue`);
      const msgs = res.data;

      if (msgs.length === 0) {
        setLoading(false);
        await startDialogue();
      } else {
        setMessages(msgs);
        const studentMsgsAtTurn3 = msgs.filter(
          (m: DialogueMessage) => m.role === 'student' && m.turn_number >= 3
        );
        if (studentMsgsAtTurn3.length > 0) {
          setDialogueComplete(true);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load dialogue', err);
      setError('Failed to load dialogue');
      setLoading(false);
    }
  };

  const startDialogue = async () => {
    setStarting(true);
    setError('');
    try {
      const startRes = await api.post(`/answers/${answerId}/dialogue/start`);
      setMessages([startRes.data]);
    } catch (err: any) {
      console.error('Failed to start dialogue', err);
      setError(err.response?.data?.detail || 'Failed to start dialogue. The AI may be temporarily unavailable.');
    } finally {
      setStarting(false);
    }
  };

  const handleSendResponse = async () => {
    if (!response.trim() || sending) return;
    setSending(true);

    try {
      const res = await api.post(`/answers/${answerId}/dialogue`, {
        student_response: response,
      });

      const newMsg = res.data;

      const studentMsg: DialogueMessage = {
        id: 'temp-' + Date.now(),
        role: 'student',
        content: response,
        turn_number: newMsg.role === 'agent' ? newMsg.turn_number - 1 : newMsg.turn_number,
        created_at: new Date().toISOString(),
      };

      if (newMsg.role === 'student') {
        setMessages((prev) => [...prev, newMsg]);
        setDialogueComplete(true);
      } else {
        setMessages((prev) => [...prev, studentMsg, newMsg]);
      }
      setResponse('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to send response');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const agentMessages = messages.filter((m) => m.role === 'agent');
  const currentTurn = Math.max(agentMessages.length, 1);
  const lastMessage = messages[messages.length - 1];
  const waitingForStudent = lastMessage?.role === 'agent' && !dialogueComplete;

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-2xl text-charcoal-800 tracking-wider uppercase">Dialogue</h1>
        {dialogueComplete && (
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 cursor-pointer transition-colors"
          >
            Return to Exam
          </button>
        )}
      </div>
      <p className="text-xs text-warmgray-400 mb-6">Turn {currentTurn} of 3</p>

      {/* Progress bar */}
      <div className="flex gap-2 mb-10">
        {[1, 2, 3].map((turn) => (
          <div key={turn} className="flex-1">
            <div className={`h-[2px] ${turn <= currentTurn ? 'bg-charcoal-800' : 'bg-warmgray-200'}`} />
          </div>
        ))}
      </div>

      {/* Starting state */}
      {starting && (
        <div className="flex flex-col items-center py-16">
          <Spinner size="lg" />
          <p className="text-warmgray-400 text-xs mt-4 uppercase tracking-wider">Generating first question...</p>
        </div>
      )}

      {/* Error state with retry */}
      {error && !starting && (
        <div className="text-center py-16">
          <p className="text-warmgray-400 font-display italic text-lg">{error}</p>
          <button
            onClick={startDialogue}
            className="mt-4 px-6 py-2 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Chat messages */}
      {!starting && !error && (
        <div className="space-y-10 mb-12 max-h-[600px] overflow-y-auto pr-2">
          {messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`max-w-[80%] px-6 py-5 ${
                msg.role === 'agent'
                  ? 'bg-cream-200 border border-warmgray-200'
                  : 'bg-cream-50 border border-warmgray-200'
              }`}>
                <p className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider mb-3">
                  {msg.role === 'agent' ? 'Examiner' : 'You'} — Turn {msg.turn_number}
                </p>
                <p className="text-sm text-charcoal-800 whitespace-pre-wrap leading-[1.8]">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Input area */}
      {waitingForStudent && !dialogueComplete && (
        <div className="pt-8">
          <div className="flex gap-3">
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your response..."
              className="flex-1 px-4 py-3 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 resize-none"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendResponse();
                }
              }}
            />
            <button
              onClick={handleSendResponse}
              disabled={sending || !response.trim()}
              className="px-4 self-end py-2 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors disabled:opacity-50"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
          <p className="text-[0.6rem] text-warmgray-400 mt-2">Enter to send, Shift+Enter for new line</p>
        </div>
      )}

      {dialogueComplete && (
        <div className="pt-10 text-center">
          <img src="/assets/diamond.png" alt="" className="ornament-img h-8 mx-auto mb-3" />
          <p className="font-display italic text-lg text-charcoal-600">Dialogue complete</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors"
          >
            Return to Exam
          </button>
        </div>
      )}
    </div>
  );
}
