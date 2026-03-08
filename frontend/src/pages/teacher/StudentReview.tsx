import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import type { ExamSession, StudentAnswer, ExamQuestion, DialogueMessage } from '../../types';

interface FullAnswer {
  answer: StudentAnswer;
  question: ExamQuestion;
  dialogue: DialogueMessage[];
}

export default function StudentReview() {
  useLanguageStore();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [fullAnswers, setFullAnswers] = useState<FullAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reEvaluating, setReEvaluating] = useState(false);

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadData = async () => {
    try {
      const sessionRes = await api.get(`/sessions/${sessionId}/evaluation`);
      console.log('[StudentReview] session data:', sessionRes.data);
      console.log('[StudentReview] ai_criterion_scores:', sessionRes.data.ai_criterion_scores);
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

  const handleReEvaluate = async () => {
    setReEvaluating(true);
    try {
      await api.post(`/sessions/${sessionId}/re-evaluate`);
      toast.success('Re-evaluation complete');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Re-evaluation failed');
    } finally {
      setReEvaluating(false);
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
    return <div className="text-center py-20 text-warmgray-400 font-display italic">{t('studentReview.sessionNotFound')}</div>;
  }

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-serif text-2xl text-charcoal-800 tracking-wider uppercase">{t('studentReview.title')}</h1>
        <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">{session.status}</span>
      </div>
      {session.ai_score !== null && (
        <p className="text-xs text-warmgray-400">
          {t('studentReview.aiScore')} <span className="font-display text-2xl text-charcoal-800">{session.ai_score.toFixed(1)}</span>/100
        </p>
      )}

      <hr className="dotted-divider" />

      {/* AI Criterion Scores */}
      <>
        <p className="label-caps mb-3">{t('studentReview.aiBreakdown')}</p>
        {session.ai_criterion_scores ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {Object.entries(session.ai_criterion_scores).filter(([k]) => k !== 'summary').map(([key, val]: [string, any]) => (
                <div key={key} style={{ background: '#E8DECE', borderInlineStart: '3px solid #C4BCB0' }} className="p-4">
                  <p className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">{key}</p>
                  <p className="font-display text-3xl text-charcoal-800 mt-1">{val?.score ?? '—'}<span className="text-sm text-warmgray-400">/100</span></p>
                  {val?.reasoning && <p className="text-xs text-warmgray-400 mt-2 leading-relaxed">{val.reasoning}</p>}
                </div>
              ))}
            </div>
            {session.ai_criterion_scores.summary && (
              <p className="text-sm text-charcoal-600 font-display italic mb-6">{session.ai_criterion_scores.summary}</p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-4 mb-6">
            <p className="text-xs text-warmgray-400 italic">AI evaluation not yet available for this session.</p>
            <button
              onClick={handleReEvaluate}
              disabled={reEvaluating}
              className="text-[0.65rem] uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors disabled:opacity-40"
              style={{ background: 'rgba(180,168,154,0.18)', border: 'none', borderRadius: '6px', padding: '6px 12px' }}
            >
              {reEvaluating ? 'Evaluating...' : 'Re-evaluate'}
            </button>
          </div>
        )}
        <hr className="dotted-divider" />
      </>

      {/* Full Transcript */}
      <p className="label-caps mb-4">{t('studentReview.transcript')}</p>
      {fullAnswers.map((fa) => (
        <div key={fa.answer.id} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-display text-charcoal-800 text-lg">{t('exam.questionNum')} {fa.question.display_order}</span>
            <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">{fa.question.question_type}</span>
          </div>

          <p className="text-charcoal-800 font-medium mb-3 text-sm leading-relaxed">{fa.question.question_text}</p>

          {/* Initial answer */}
          <div className="bg-cream-200 border border-warmgray-200 p-4 mb-3">
            <p className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider mb-2">{t('studentReview.initialAnswer')}</p>
            {fa.answer.answer_text ? (
              <p className="text-charcoal-800 text-sm leading-relaxed">{fa.answer.answer_text}</p>
            ) : fa.answer.mcq_selections ? (
              <div className="space-y-1">
                {fa.answer.mcq_selections.map((sel: any, i: number) => (
                  <p key={i} className="text-sm">
                    <span className="font-serif text-charcoal-800">{sel.key}:</span> {sel.justification}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          {/* Dialogue turns */}
          <div className="space-y-2">
            {fa.dialogue.map((msg) => (
              <div key={msg.id} className={`p-4 border ${
                msg.role === 'agent'
                  ? 'bg-cream-50 border-warmgray-200'
                  : 'bg-cream-200 border-warmgray-200'
              }`}>
                <p className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider mb-1">
                  {msg.role === 'agent' ? t('studentReview.examiner') : t('studentReview.studentLabel')} — Turn {msg.turn_number}
                </p>
                <p className="text-charcoal-800 text-sm leading-relaxed">{msg.content}</p>
              </div>
            ))}
          </div>

          <hr className="dotted-divider" />
        </div>
      ))}

      {/* Grading section */}
      {session.status !== 'validated' && (
        <div className="bg-cream-200 border border-warmgray-200 p-6">
          <p className="font-serif text-xl text-charcoal-800 mb-5">{t('studentReview.assignGrade')}</p>

          {/* Grade input */}
          <div className="flex items-center gap-2 mb-6">
            <input
              type="number"
              min={0}
              max={5}
              step={1}
              value={grade}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v >= 0 && v <= 5) setGrade(v);
              }}
              className="w-16 px-3 py-2 bg-cream-50 border border-warmgray-200 text-charcoal-800 font-display text-2xl text-center focus:outline-none focus:border-charcoal-600"
            />
            <span className="text-warmgray-400 text-lg">/ 5</span>
          </div>

          <div className="mb-4">
            <p className="label-caps mb-2">{t('studentReview.feedback')}</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t('studentReview.feedbackPlaceholder')}
              rows={3}
              className="w-full px-4 py-3 bg-cream-50 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 resize-y"
            />
          </div>

          <div className="mb-6">
            <p className="label-caps mb-2">{t('studentReview.internalNotes')}</p>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder={t('studentReview.notesPlaceholder')}
              rows={2}
              className="w-full px-4 py-3 bg-cream-50 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 resize-y"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => handleSubmitGrade('re_dialogue_requested')}
              disabled={submitting}
              className="px-4 py-2 bg-cream-50 border border-warmgray-200 text-xs uppercase tracking-widest text-warmgray-400 hover:text-charcoal-900 cursor-pointer transition-colors disabled:opacity-50"
            >
              {t('studentReview.reDialogue')}
            </button>
            <button
              onClick={() => handleSubmitGrade('overridden')}
              disabled={submitting}
              className="px-4 py-2 bg-cream-50 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors disabled:opacity-50"
            >
              {t('studentReview.override')}
            </button>
            <button
              onClick={() => handleSubmitGrade('approved')}
              disabled={submitting}
              className="px-6 py-2 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors disabled:opacity-50"
            >
              {submitting ? t('studentReview.submittingGrade') : t('studentReview.approveGrade')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
