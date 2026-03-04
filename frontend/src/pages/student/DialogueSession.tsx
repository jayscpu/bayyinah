import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import type { DialogueMessage, AnswerWithQuestion } from '../../types';

export default function DialogueSession() {
  const { answerId } = useParams<{ answerId: string }>();
  const navigate = useNavigate();
  const [answerContext, setAnswerContext] = useState<AnswerWithQuestion | null>(null);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [dialogueComplete, setDialogueComplete] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { loadDialogue(); }, [answerId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const loadDialogue = async () => {
    try {
      setError('');
      const [contextRes, msgsRes] = await Promise.all([
        api.get(`/answers/${answerId}`),
        api.get(`/answers/${answerId}/dialogue`),
      ]);
      setAnswerContext(contextRes.data);
      const msgs = msgsRes.data;
      if (msgs.length === 0) {
        setLoading(false);
        await startDialogue();
      } else {
        setMessages(msgs);
        if (msgs.some((m: DialogueMessage) => m.role === 'student' && m.turn_number >= 2)) {
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
      setError(err.response?.data?.detail || 'Failed to start dialogue. The AI may be temporarily unavailable.');
    } finally {
      setStarting(false);
    }
  };

  const handleSendResponse = async () => {
    if (!response.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/answers/${answerId}/dialogue`, { student_response: response });
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
      textareaRef.current?.focus();
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

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl text-charcoal-800 tracking-wider uppercase">Dialogue</h1>
          <span className={`dialogue-status-pill ${dialogueComplete ? 'complete' : ''}`}>
            {dialogueComplete ? 'Complete' : `Turn ${currentTurn} of 2`}
          </span>
        </div>
        {dialogueComplete && (
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 cursor-pointer transition-colors"
          >
            Return to Exam
          </button>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div className="flex gap-2 mt-4 mb-8">
        {[1, 2].map((turn) => (
          <div key={turn} className="flex-1 h-px bg-warmgray-200 overflow-hidden">
            <div
              className="h-full bg-charcoal-800 transition-all duration-700 ease-in-out"
              style={{ width: dialogueComplete || turn <= currentTurn ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* ── Question context card (pinned) ── */}
      {answerContext && (
        <div className="dialogue-context-card mb-8 border border-warmgray-200 bg-cream-50">
          <div className="px-5 py-4 border-b border-warmgray-200 bg-cream-200">
            <p className="label-caps mb-2">Question</p>
            <p className="font-serif text-charcoal-800 text-base leading-[1.85]">
              {answerContext.question_text}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="label-caps mb-2">Your Answer</p>
            {answerContext.answer_text ? (
              <p className="text-sm text-charcoal-700 leading-[1.8] whitespace-pre-wrap">
                {answerContext.answer_text}
              </p>
            ) : answerContext.mcq_selections?.length ? (
              <div className="space-y-2">
                {answerContext.mcq_selections.map((sel, i) => (
                  <div key={i} className="flex gap-2 text-sm text-charcoal-700">
                    <span className="font-serif font-semibold">{sel.key}.</span>
                    <span className="italic text-charcoal-600">{sel.justification}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-warmgray-400 italic">No answer recorded.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Starting ── */}
      {starting && (
        <div className="flex flex-col items-center py-16">
          <Spinner size="lg" />
          <p className="text-warmgray-400 text-xs mt-4 uppercase tracking-wider">Generating first question...</p>
        </div>
      )}

      {/* ── Error ── */}
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

      {/* ── Chat thread ── */}
      {!starting && !error && (
        <div className="space-y-7 mb-6">
          {messages.map((msg, i) => {
            const isAgent = msg.role === 'agent';
            return (
              <div
                key={msg.id || i}
                className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} animate-fade-in-up`}
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
              >
                {/* Label above bubble */}
                <p className="text-[0.55rem] text-warmgray-400 uppercase tracking-widest mb-1.5 px-1">
                  {isAgent ? 'Examiner' : 'You'} &middot; Turn {msg.turn_number}
                </p>

                <div className={`flex items-end gap-2 max-w-[78%] ${isAgent ? '' : 'flex-row-reverse'}`}>
                  {/* Examiner avatar */}
                  {isAgent && (
                    <div className="dialogue-avatar mb-0.5">
                      <span className="text-cream-50 font-serif text-[0.6rem] tracking-wide">E</span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`px-5 py-4 border border-warmgray-200 ${
                    isAgent
                      ? 'dialogue-bubble-agent bg-cream-200'
                      : 'dialogue-bubble-student bg-cream-50'
                  }`}>
                    <p className="text-sm text-charcoal-800 whitespace-pre-wrap leading-[1.85]">
                      {msg.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {(sending || starting) && (
            <div className="flex flex-col items-start animate-fade-in">
              <p className="text-[0.55rem] text-warmgray-400 uppercase tracking-widest mb-1.5 px-1">
                Examiner
              </p>
              <div className="flex items-end gap-2">
                <div className="dialogue-avatar">
                  <span className="text-cream-50 font-serif text-[0.6rem] tracking-wide">E</span>
                </div>
                <div className="dialogue-bubble-agent px-5 py-4 bg-cream-200 border border-warmgray-200 flex gap-1.5 items-center h-[46px]">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-warmgray-400 animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      )}

      {/* ── Composer (input) ── */}
      {waitingForStudent && !dialogueComplete && !error && (
        <div className="sticky bottom-0 bg-cream-100 border-t border-warmgray-200 pt-4 pb-4 mt-2 animate-fade-in">
          <p className="label-caps mb-3">Your Response</p>
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your response..."
              className="flex-1 px-4 py-3 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 resize-none transition-colors duration-200 leading-[1.7]"
              rows={3}
              disabled={sending}
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
              className="px-5 py-3 bg-charcoal-800 text-cream-50 text-xs uppercase tracking-widest hover:bg-charcoal-700 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed self-end"
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
          <p className="text-[0.6rem] text-warmgray-400 mt-2">Enter to send · Shift+Enter for new line</p>
        </div>
      )}

      {/* ── Complete ── */}
      {dialogueComplete && (
        <div className="pt-10 text-center animate-fade-in">
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
