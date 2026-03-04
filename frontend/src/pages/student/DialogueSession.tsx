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
  }, [messages]);

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
    } catch {
      setError('Failed to load dialogue');
      setLoading(false);
    }
  };

  const startDialogue = async () => {
    setStarting(true);
    setError('');
    try {
      const res = await api.post(`/answers/${answerId}/dialogue/start`);
      setMessages([res.data]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'The AI is temporarily unavailable.');
    } finally {
      setStarting(false);
    }
  };

  const handleSend = async () => {
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
      setError(err.response?.data?.detail || 'Failed to send response');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const agentMessages = messages.filter((m) => m.role === 'agent');
  const currentTurn = Math.max(agentMessages.length, 1);
  const lastMessage = messages[messages.length - 1];
  const waitingForStudent = lastMessage?.role === 'agent' && !dialogueComplete;

  return (
    <div className="animate-fade-in max-w-2xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="font-serif text-2xl text-charcoal-800 tracking-wider uppercase">Dialogue</h1>
          <p className="text-xs text-warmgray-400 mt-0.5">
            {dialogueComplete ? 'Complete' : `Turn ${currentTurn} of 2`}
          </p>
        </div>
        {dialogueComplete && (
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors cursor-pointer"
          >
            Return to Exam
          </button>
        )}
      </div>

      {/* ── Progress ── */}
      <div className="flex gap-2 mt-5 mb-10">
        {[1, 2].map((t) => (
          <div key={t} className="flex-1 h-px bg-warmgray-200 overflow-hidden">
            <div
              className="h-full bg-charcoal-800 transition-all duration-700 ease-in-out"
              style={{ width: dialogueComplete || t <= currentTurn ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* ── Original Q & A ── */}
      {answerContext && (
        <div className="mb-10 animate-fade-in">
          <p className="label-caps mb-3">Question</p>
          <p className="font-serif text-charcoal-800 text-lg leading-[1.85] mb-6">
            {answerContext.question_text}
          </p>

          <hr className="dotted-divider" />

          <p className="label-caps mb-3 mt-6">Your Answer</p>
          {answerContext.answer_text ? (
            <p className="text-sm text-charcoal-700 leading-[1.9] whitespace-pre-wrap">
              {answerContext.answer_text}
            </p>
          ) : answerContext.mcq_selections?.length ? (
            <div className="space-y-3">
              {answerContext.mcq_selections.map((sel, i) => (
                <div key={i} className="flex gap-3">
                  <span className="font-serif text-charcoal-800 font-semibold">{sel.key}.</span>
                  <p className="text-sm text-charcoal-600 italic leading-[1.8]">{sel.justification}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warmgray-400 italic">No answer recorded.</p>
          )}
        </div>
      )}

      {/* ── Starting ── */}
      {starting && (
        <div className="flex flex-col items-center py-16 animate-fade-in gap-4">
          <Spinner size="lg" />
          <p className="font-display italic text-warmgray-400 text-lg">Generating first question…</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && !starting && (
        <div className="text-center py-12 animate-fade-in">
          <p className="font-display italic text-warmgray-400 text-lg mb-5">{error}</p>
          <button
            onClick={() => { setError(''); startDialogue(); }}
            className="px-6 py-2 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Dialogue section ── */}
      {!starting && !error && messages.length > 0 && (
        <>
          <hr className="dotted-divider mb-8" />

          <div className="space-y-8 mb-10">
            {messages.map((msg, i) => {
              const isAgent = msg.role === 'agent';
              return (
                <div
                  key={msg.id || i}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
                >
                  <p className="label-caps mb-3">
                    {isAgent ? 'Examiner' : 'You'} &middot; Turn {msg.turn_number}
                  </p>
                  <div className={`px-5 py-5 border border-warmgray-200 ${isAgent ? 'bg-cream-200' : 'bg-cream-50'}`}>
                    <p className="text-sm text-charcoal-800 whitespace-pre-wrap leading-[1.9]">
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {sending && (
              <div className="animate-fade-in">
                <p className="label-caps mb-3">Examiner</p>
                <div className="px-5 py-5 bg-cream-200 border border-warmgray-200 flex gap-1.5 items-center">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-warmgray-400 animate-bounce"
                          style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </>
      )}

      {/* ── Input ── */}
      {waitingForStudent && !dialogueComplete && !error && (
        <div className="animate-fade-in-up">
          <p className="label-caps mb-3">Your Response</p>
          <textarea
            ref={textareaRef}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write your response here…"
            className="w-full px-5 py-4 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 resize-none leading-[1.8] transition-colors duration-200"
            rows={5}
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">
              Enter to send · Shift+Enter for new line
            </p>
            <button
              onClick={handleSend}
              disabled={sending || !response.trim()}
              className="px-6 py-2 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* ── Complete ── */}
      {dialogueComplete && (
        <div className="pt-10 text-center animate-fade-in">
          <img src="/assets/diamond.png" alt="" className="ornament-img h-8 mx-auto mb-4" />
          <p className="font-display italic text-lg text-charcoal-600 mb-1">Dialogue complete</p>
          <p className="text-xs text-warmgray-400 mb-6">Your responses have been recorded.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 transition-colors cursor-pointer"
          >
            Return to Exam
          </button>
        </div>
      )}
    </div>
  );
}
