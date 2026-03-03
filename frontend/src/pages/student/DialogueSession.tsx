import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import type { DialogueMessage } from '../../types';

export default function DialogueSession() {
  const { answerId } = useParams<{ answerId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
      // Get existing messages
      const res = await api.get(`/answers/${answerId}/dialogue`);
      const msgs = res.data;

      if (msgs.length === 0) {
        // Start dialogue — get first Socratic question
        const startRes = await api.post(`/answers/${answerId}/dialogue/start`);
        setMessages([startRes.data]);
      } else {
        setMessages(msgs);
        // Check if complete (3 agent + 3 student = 6 messages, or last student message at turn 3)
        const studentMsgsAtTurn3 = msgs.filter(
          (m: DialogueMessage) => m.role === 'student' && m.turn_number >= 3
        );
        if (studentMsgsAtTurn3.length > 0) {
          setDialogueComplete(true);
        }
      }
    } catch (err) {
      console.error('Failed to load dialogue', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = async () => {
    if (!response.trim() || sending) return;
    setSending(true);

    try {
      const res = await api.post(`/answers/${answerId}/dialogue`, {
        student_response: response,
      });

      // The response is either a student message (if dialogue complete) or next agent question
      const newMsg = res.data;

      // Add student message first
      const studentMsg: DialogueMessage = {
        id: 'temp-' + Date.now(),
        role: 'student',
        content: response,
        turn_number: newMsg.turn_number,
        created_at: new Date().toISOString(),
      };

      if (newMsg.role === 'student') {
        // Dialogue is complete — this was the last student response
        setMessages((prev) => [...prev, newMsg]);
        setDialogueComplete(true);
      } else {
        // Got next agent question
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
  const currentTurn = agentMessages.length;
  const lastMessage = messages[messages.length - 1];
  const waitingForStudent = lastMessage?.role === 'agent' && !dialogueComplete;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="label-caps mb-2">Socratic Examination</p>
          <h1 className="heading-display text-3xl text-charcoal-800">Dialogue</h1>
          <p className="text-warmgray-400 text-sm mt-1">
            Turn {currentTurn} of 3
          </p>
        </div>
        {dialogueComplete && (
          <Button onClick={() => navigate(-1)}>
            Return to Exam
          </Button>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex gap-3">
        {[1, 2, 3].map((turn) => (
          <div key={turn} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full transition-colors ${
                turn <= currentTurn ? 'bg-sage-500' : 'bg-warmgray-200'
              }`}
            />
            <span className={`text-xs ${turn <= currentTurn ? 'text-sage-500' : 'text-warmgray-300'}`}>
              {turn}
            </span>
          </div>
        ))}
      </div>

      {/* Chat messages */}
      <Card decorative className="min-h-[400px] flex flex-col">
        <div className="flex-1 space-y-4 mb-4 overflow-y-auto max-h-[500px] pr-2">
          {messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[80%] rounded-sm px-5 py-4 ${
                  msg.role === 'agent'
                    ? 'bg-sage-500/5 text-charcoal-800 border border-sage-300/50'
                    : 'paper-warm text-charcoal-800 border border-warmgray-200'
                }`}
              >
                <p className="label-caps text-[0.6rem] mb-2">
                  {msg.role === 'agent' ? 'Examiner' : 'You'} — Turn {msg.turn_number}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        {waitingForStudent && !dialogueComplete && (
          <div className="border-t border-warmgray-200 pt-4">
            <div className="flex gap-3">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 px-4 py-2.5 bg-cream-50 border border-warmgray-200 rounded-sm text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-sage-500 resize-none"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendResponse();
                  }
                }}
              />
              <Button onClick={handleSendResponse} disabled={sending || !response.trim()}>
                {sending ? '...' : 'Send'}
              </Button>
            </div>
            <p className="text-xs text-warmgray-400 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        )}

        {dialogueComplete && (
          <div className="border-t border-warmgray-200 pt-6 text-center">
            <div className="ornament-divider mb-4">
              <div className="ornament-diamond" />
            </div>
            <p className="text-sage-600 font-display italic text-lg">Dialogue complete for this question</p>
            <Button className="mt-4" onClick={() => navigate(-1)}>
              Return to Exam
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
