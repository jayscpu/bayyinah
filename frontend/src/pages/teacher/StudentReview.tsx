import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextArea from '../../components/ui/TextArea';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import type { ExamSession, StudentAnswer, ExamQuestion, DialogueMessage } from '../../types';

interface FullAnswer {
  answer: StudentAnswer;
  question: ExamQuestion;
  dialogue: DialogueMessage[];
}

export default function StudentReview() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [fullAnswers, setFullAnswers] = useState<FullAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState(3);
  const [feedback, setFeedback] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadData = async () => {
    try {
      const sessionRes = await api.get(`/sessions/${sessionId}/evaluation`);
      setSession(sessionRes.data);

      const answersRes = await api.get(`/sessions/${sessionId}/answers`);
      const answers: StudentAnswer[] = answersRes.data;

      const full: FullAnswer[] = [];
      for (const answer of answers) {
        const [questionRes, dialogueRes] = await Promise.all([
          api.get(`/exams/${sessionRes.data.exam_id}/questions`).then((res) =>
            res.data.find((q: ExamQuestion) => q.id === answer.question_id)
          ),
          api.get(`/answers/${answer.id}/dialogue`),
        ]);
        full.push({
          answer,
          question: questionRes,
          dialogue: dialogueRes.data,
        });
      }
      full.sort((a, b) => a.question.display_order - b.question.display_order);
      setFullAnswers(full);
    } catch (err) {
      console.error('Failed to load session data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGrade = async (action: string) => {
    setSubmitting(true);
    try {
      await api.post(`/sessions/${sessionId}/grade`, {
        final_grade: grade,
        feedback: feedback || null,
        internal_notes: internalNotes || null,
        action_taken: action,
      });
      toast.success('Grade submitted!');
      navigate(-1);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit grade');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!session) {
    return <div className="text-center py-20 text-warmgray-500 font-display italic text-lg">Session not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <p className="label-caps mb-2">Grading</p>
          <h1 className="heading-display text-3xl text-charcoal-800">Student Review</h1>
          {session.ai_score !== null && (
            <p className="text-warmgray-400 text-sm mt-2">
              AI Score: <span className="text-sage-500 font-display text-2xl">{session.ai_score.toFixed(1)}/100</span>
            </p>
          )}
        </div>
        <Badge variant={session.status === 'validated' ? 'success' : 'warning'}>
          {session.status}
        </Badge>
      </div>

      {/* AI Criterion Scores */}
      {session.ai_criterion_scores && (
        <Card>
          <h3 className="font-serif text-lg text-charcoal-800 mb-4">AI Score Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(session.ai_criterion_scores).filter(([k]) => k !== 'summary').map(([key, val]: [string, any]) => (
              <div key={key} className="p-4 paper-warm rounded-sm border border-warmgray-200">
                <p className="label-caps text-[0.6rem]">{key}</p>
                <p className="heading-display text-3xl text-charcoal-800 mt-1">{val?.score ?? '—'}<span className="text-sm text-warmgray-400">/100</span></p>
                {val?.reasoning && <p className="text-xs text-warmgray-400 mt-2 leading-relaxed">{val.reasoning}</p>}
              </div>
            ))}
          </div>
          {session.ai_criterion_scores.summary && (
            <p className="text-sm text-charcoal-600 mt-4 font-display italic">{session.ai_criterion_scores.summary}</p>
          )}
        </Card>
      )}

      {/* Full Transcript */}
      <div className="ornament-divider">
        <div className="ornament-diamond" />
      </div>

      <h2 className="font-serif text-xl text-charcoal-800">Dialogue Transcript</h2>
      {fullAnswers.map((fa) => (
        <Card key={fa.answer.id} decorative>
          <div className="flex items-center gap-2 mb-4">
            <span className="font-display text-sage-500 text-lg">Question {fa.question.display_order}</span>
            <Badge variant={fa.question.question_type === 'essay' ? 'info' : 'warning'}>
              {fa.question.question_type.toUpperCase()}
            </Badge>
          </div>

          <p className="text-charcoal-800 font-medium mb-4 text-sm leading-relaxed">{fa.question.question_text}</p>

          {/* Initial answer */}
          <div className="p-4 paper-warm rounded-sm border border-warmgray-200 mb-4">
            <p className="label-caps text-[0.6rem] mb-2">Student's Initial Answer</p>
            {fa.answer.answer_text ? (
              <p className="text-charcoal-800 text-sm leading-relaxed">{fa.answer.answer_text}</p>
            ) : fa.answer.mcq_selections ? (
              <div className="space-y-1">
                {fa.answer.mcq_selections.map((sel: any, i: number) => (
                  <p key={i} className="text-sm">
                    <span className="font-serif text-sage-500">{sel.key}:</span> {sel.justification}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          {/* Dialogue turns */}
          <div className="space-y-3">
            {fa.dialogue.map((msg) => (
              <div key={msg.id} className={`p-4 rounded-sm border ${
                msg.role === 'agent'
                  ? 'bg-sage-500/5 border-sage-300/50'
                  : 'paper-warm border-warmgray-200'
              }`}>
                <p className="label-caps text-[0.6rem] mb-1">
                  {msg.role === 'agent' ? 'Examiner' : 'Student'} — Turn {msg.turn_number}
                </p>
                <p className="text-charcoal-800 text-sm leading-relaxed">{msg.content}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Grading section */}
      {session.status !== 'validated' && (
        <Card decorative>
          <h2 className="font-serif text-xl text-charcoal-800 mb-5">Assign Grade</h2>

          {/* Grade selector */}
          <div className="flex gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`flex-1 p-4 rounded-sm border text-center cursor-pointer transition-all
                  ${grade === g
                    ? 'border-sage-500 bg-sage-500/10 text-sage-600'
                    : 'border-warmgray-200 text-charcoal-600 hover:border-warmgray-400'
                  }`}
              >
                <div className="heading-display text-3xl">{g}</div>
              </button>
            ))}
          </div>

          <TextArea
            label="Feedback (visible to student)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write feedback for the student..."
            rows={3}
          />

          <div className="mt-4">
            <TextArea
              label="Internal Notes (teacher only)"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Your private notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <Button variant="secondary" onClick={() => handleSubmitGrade('re_dialogue_requested')} disabled={submitting}>
              Request Re-Dialogue
            </Button>
            <Button variant="secondary" onClick={() => handleSubmitGrade('overridden')} disabled={submitting}>
              Override & Save
            </Button>
            <Button onClick={() => handleSubmitGrade('approved')} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Approve Grade'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
