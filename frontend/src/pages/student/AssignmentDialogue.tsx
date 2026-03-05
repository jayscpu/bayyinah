import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import type { AssignmentSubmission, AssignmentDialogueMessage } from '../../types';

type MessageGroup = {
  role: 'agent' | 'student';
  turn_number: number;
  msgs: AssignmentDialogueMessage[];
};

function groupMessages(messages: AssignmentDialogueMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const msg of messages) {
    const last = groups[groups.length - 1];
    if (last && last.role === msg.role && last.turn_number === msg.turn_number) {
      last.msgs.push(msg);
    } else {
      groups.push({ role: msg.role as 'agent' | 'student', turn_number: msg.turn_number, msgs: [msg] });
    }
  }
  return groups;
}

export default function AssignmentDialogue() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [messages, setMessages] = useState<AssignmentDialogueMessage[]>([]);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [dialogueComplete, setDialogueComplete] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { loadDialogue(); }, [submissionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const loadDialogue = async () => {
    try {
      setError('');
      const [subRes, msgsRes] = await Promise.all([
        api.get(`/assignment-submissions/${submissionId}`),
        api.get(`/assignment-submissions/${submissionId}/dialogue`),
      ]);
      setSubmission(subRes.data);
      const msgs = msgsRes.data;
      if (msgs.length === 0) {
        setLoading(false);
        await startDialogue();
      } else {
        setMessages(msgs);
        if (msgs.some((m: AssignmentDialogueMessage) => m.role === 'student' && m.turn_number >= 2)) {
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
      const res = await api.post(`/assignment-submissions/${submissionId}/dialogue/start`);
      setMessages([res.data]);
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
      const res = await api.post(`/assignment-submissions/${submissionId}/dialogue`, { student_response: response });
      const newMsg = res.data;
      const studentMsg: AssignmentDialogueMessage = {
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

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const agentMessages = messages.filter((m) => m.role === 'agent');
  const currentTurn = Math.max(agentMessages.length, 1);
  const lastMessage = messages[messages.length - 1];
  const waitingForStudent = lastMessage?.role === 'agent' && !dialogueComplete;
  const groups = groupMessages(messages);

  return (
    <div className="max-w-3xl animate-fade-in" style={{ paddingLeft: '28px' }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="font-serif text-2xl text-charcoal-800 tracking-wider uppercase">Dialogue</h1>
          {dialogueComplete ? (
            <p className="text-[0.6rem] text-warmgray-400 mt-1.5 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-warmgray-400" />
              <span className="font-display italic tracking-wider">complete</span>
            </p>
          ) : (
            <p className="text-xs text-warmgray-400 mt-1">Turn {currentTurn} of 2</p>
          )}
        </div>
        <button
          onClick={() => navigate('/student/assignments')}
          className="text-xs text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 cursor-pointer transition-colors mt-1"
        >
          ← Back
        </button>
      </div>

      {/* Assignment context card */}
      {submission && (
        <div className="dialogue-context-card" style={{ marginBottom: '44px', background: 'rgba(180,168,154,0.18)' }}>
          <div className="pb-5" style={{ paddingTop: '12px', paddingLeft: '16px', paddingRight: '28px' }}>
            <p className="label-caps mb-3">Assignment</p>
            <p className="font-serif text-charcoal-800 text-base leading-[1.85]">
              {submission.assignment_title}
            </p>
          </div>
          {submission.original_filename && (
            <div className="pb-6 border-t border-warmgray-200" style={{ paddingTop: '12px', paddingLeft: '16px', paddingRight: '28px' }}>
              <p className="label-caps mb-3">Your Submission</p>
              <p className="text-sm text-charcoal-800">{submission.original_filename}</p>
            </div>
          )}
        </div>
      )}

      {/* Starting */}
      {starting && (
        <div className="flex flex-col items-center py-16">
          <Spinner size="lg" />
          <p className="text-warmgray-400 text-xs mt-4 uppercase tracking-wider">Generating first question...</p>
        </div>
      )}

      {/* Error */}
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

      {/* Chat thread */}
      {!starting && !error && (
        <div className="mb-6">
          {groups.map((group, gi) => {
            const isAgent = group.role === 'agent';
            return (
              <div
                key={`${group.role}-${group.turn_number}-${gi}`}
                className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} animate-fade-in-up`}
                style={{ marginTop: gi === 0 ? '0' : '12px', animationDelay: `${gi * 50}ms`, animationFillMode: 'both' }}
              >
                <div className={`flex items-center gap-2 mt-1 mb-3 ${isAgent ? '' : 'flex-row-reverse'}`}>
                  <p className="text-[0.55rem] text-warmgray-400 uppercase tracking-widest">
                    {isAgent ? 'Examiner' : 'You'} &middot; Turn {group.turn_number}
                  </p>
                </div>

                <div className={`flex flex-col gap-1 max-w-[78%] ${isAgent ? 'items-start' : 'items-end'}`}>
                  {group.msgs.map((msg) => (
                    <div
                      key={msg.id}
                      className={`border border-warmgray-200 ${
                        isAgent ? 'dialogue-bubble-agent' : 'dialogue-bubble-student bg-cream-50'
                      }`}
                      style={{
                        padding: '10px 14px',
                        ...(isAgent ? { background: 'rgba(180,168,154,0.18)' } : {}),
                      }}
                    >
                      <p className="text-sm text-charcoal-800 whitespace-pre-wrap leading-[1.85]">
                        {msg.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {(sending || (starting && messages.length > 0)) && (
            <div className="flex flex-col items-start mt-8 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[0.55rem] text-warmgray-400 uppercase tracking-widest">Examiner</p>
              </div>
              <div
                className="dialogue-bubble-agent px-5 py-4 border border-warmgray-200 flex gap-1.5 items-center"
                style={{ background: 'rgba(180,168,154,0.18)' }}
              >
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-warmgray-400 animate-bounce"
                        style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      )}

      {/* Composer */}
      {waitingForStudent && !dialogueComplete && !error && (
        <div className="sticky bottom-0 bg-cream-100 animate-fade-in" style={{ marginTop: '12px', padding: '16px' }}>
          <p className="label-caps mb-3">Your Response</p>
          <textarea
            ref={textareaRef}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your response..."
            className="w-full px-4 py-3 bg-cream-200 text-charcoal-800 text-sm placeholder-warmgray-400 resize-none transition-colors duration-200 leading-[1.7]"
            style={{ outline: 'none', border: 'none', display: 'block' }}
            rows={3}
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendResponse();
              }
            }}
          />
          <div className="flex items-center justify-end mt-2">
            <button
              onClick={handleSendResponse}
              disabled={sending || !response.trim()}
              className="text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-transparent border-none"
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Complete */}
      {dialogueComplete && (
        <div className="pt-10 text-center animate-fade-in">
          <img src="/assets/diamond.png" alt="" className="ornament-img h-8 mx-auto mb-3" />
          <p className="font-display italic text-lg text-charcoal-600">Dialogue complete</p>
          <p className="text-xs text-warmgray-400 mt-1">Your submission is being graded by AI</p>
          <button
            onClick={() => navigate('/student/assignments')}
            className="mt-4 text-xs uppercase tracking-widest text-warmgray-400 hover:text-charcoal-800 cursor-pointer transition-colors"
            style={{ borderRadius: '10px', padding: '8px 12px', background: 'rgba(180,168,154,0.18)' }}
          >
            Back to Assignments
          </button>
        </div>
      )}
    </div>
  );
}
