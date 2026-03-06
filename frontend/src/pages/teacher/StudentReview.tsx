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
  const [grade, setGrade] = useState('');
  const [questionGrades, setQuestionGrades] = useState<Record<string, string>>({});
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

  const totalQuestionPoints = Object.values(questionGrades).reduce((sum, v) => {
    const n = parseFloat(v);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const handleSubmitGrade = async (action: string) => {
    const finalGrade = parseInt(grade);
    if (isNaN(finalGrade) || finalGrade < 0 || finalGrade > 5) {
      toast.error('Final grade must be between 0 and 5');
      return;
    }
    setSubmitting(true);
    try {
      const qGrades: Record<string, number> = {};
      for (const [qId, val] of Object.entries(questionGrades)) {
        const n = parseFloat(val);
        if (!isNaN(n)) qGrades[qId] = n;
      }
      await api.post(`/sessions/${sessionId}/grade`, {
        final_grade: finalGrade,
        feedback: feedback || null,
        internal_notes: internalNotes || null,
        action_taken: action,
        question_grades: Object.keys(qGrades).length > 0 ? qGrades : null,
        total_points: Object.keys(qGrades).length > 0 ? totalQuestionPoints : null,
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
      {/* Header */}
      <div className="flex justify-center mb-6">
        <img src="/assets/diamond.png" alt="" className="h-8 w-auto" />
      </div>
      <h1 className="font-display text-[2rem] text-charcoal-800 text-center leading-tight mb-1">
        {t('studentReview.title')}
      </h1>
      <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#A89E92', textAlign: 'center', marginBottom: '8px' }}>
        {session.status.replace('_', ' ')}
      </p>

      {session.ai_score !== null && (
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#A89E92', marginBottom: '4px' }}>
            {t('studentReview.aiScore')}
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: '#2A2A2A', lineHeight: 1 }}>
            {session.ai_score.toFixed(1)}<span style={{ fontSize: '1rem', color: '#A89E92' }}>/100</span>
          </p>
        </div>
      )}

      <div style={{ borderTop: '1px solid #2A2A2A', marginBottom: '0', marginTop: '20px' }} />

      {/* AI Criterion Scores */}
      {session.ai_criterion_scores && (
        <div style={{ paddingTop: '28px' }}>
          <p className="label-caps mb-4">{t('studentReview.aiBreakdown')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {Object.entries(session.ai_criterion_scores).filter(([k]) => k !== 'summary').map(([key, val]: [string, any]) => (
              <div key={key} style={{ padding: '20px', background: '#E8DECE', borderInlineStart: '3px solid #C4BCB0' }}>
                <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#A89E92', marginBottom: '8px' }}>{key}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#2A2A2A', lineHeight: 1 }}>
                  {val?.score ?? '—'}<span style={{ fontSize: '0.75rem', color: '#A89E92' }}>/100</span>
                </p>
                {val?.reasoning && (
                  <p style={{ fontSize: '0.75rem', color: '#7A7A7A', marginTop: '10px', lineHeight: 1.6, fontStyle: 'italic' }}>{val.reasoning}</p>
                )}
              </div>
            ))}
          </div>
          {session.ai_criterion_scores.summary && (
            <p className="text-sm text-charcoal-600 font-display italic mb-6" style={{ lineHeight: 1.8 }}>{session.ai_criterion_scores.summary}</p>
          )}
          <hr className="dotted-divider" />
        </div>
      )}

      {/* Full Transcript */}
      <p className="label-caps mb-5">{t('studentReview.transcript')}</p>
      {fullAnswers.map((fa) => (
        <div key={fa.answer.id} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span className="font-display" style={{ fontSize: '1.25rem', color: '#2A2A2A' }}>
                {t('exam.questionNum')} {fa.question.display_order}
              </span>
              <span style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {fa.question.question_type}
              </span>
            </div>
            {/* Per-question grade input */}
            {session.status !== 'validated' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={questionGrades[fa.question.id] ?? ''}
                  onChange={(e) => setQuestionGrades(prev => ({ ...prev, [fa.question.id]: e.target.value }))}
                  placeholder="—"
                  style={{
                    width: '52px', padding: '6px 8px', background: '#F5F0E8', border: '1px solid #D4CCC0',
                    color: '#2A2A2A', fontSize: '1rem', textAlign: 'center', outline: 'none',
                    fontFamily: 'var(--font-display)',
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: '#A89E92' }}>
                  {fa.question.points != null ? `/ ${fa.question.points}` : 'pts'}
                </span>
              </div>
            )}
          </div>

          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: '#2A2A2A', lineHeight: 1.8, marginBottom: '16px' }}>
            {fa.question.question_text}
          </p>

          {/* Initial answer */}
          <div style={{ padding: '18px 22px', background: '#E6E0D4', borderInlineStart: '2px solid #C4BCB0', marginBottom: '10px' }}>
            <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#A89E92', marginBottom: '8px' }}>
              {t('studentReview.initialAnswer')}
            </p>
            {fa.answer.answer_text ? (
              <p style={{ fontSize: '0.875rem', color: '#3D3D3D', lineHeight: 1.7 }}>{fa.answer.answer_text}</p>
            ) : fa.answer.mcq_selections ? (
              <div className="space-y-1">
                {fa.answer.mcq_selections.map((sel: any, i: number) => (
                  <p key={i} style={{ fontSize: '0.875rem', color: '#3D3D3D' }}>
                    <span className="font-serif" style={{ color: '#2A2A2A', fontWeight: 500 }}>{sel.key}:</span> {sel.justification}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          {/* Dialogue turns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {fa.dialogue.map((msg) => (
              <div key={msg.id} style={{
                padding: '16px 22px',
                background: msg.role === 'agent' ? 'transparent' : '#E6E0D4',
                borderInlineStart: msg.role === 'agent' ? '2px solid #D4CCC0' : '2px solid #C4BCB0',
              }}>
                <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A89E92', marginBottom: '6px' }}>
                  {msg.role === 'agent' ? t('studentReview.examiner') : t('studentReview.studentLabel')} — {t('dialogue.turn')} {msg.turn_number}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#3D3D3D', lineHeight: 1.7 }}>{msg.content}</p>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dotted #C4BCB0', marginTop: '28px' }} />
        </div>
      ))}

      {/* Grading section */}
      {session.status !== 'validated' && (
        <div style={{ marginTop: '16px', padding: '32px', background: '#E8DECE' }}>
          <p className="font-display" style={{ fontSize: '1.5rem', color: '#2A2A2A', marginBottom: '24px', textAlign: 'center' }}>
            {t('studentReview.assignGrade')}
          </p>

          {/* Question points summary */}
          {Object.keys(questionGrades).length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', gap: '24px' }}>
              {fullAnswers.map((fa) => (
                <div key={fa.question.id} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A89E92', marginBottom: '4px' }}>
                    Q{fa.question.display_order}
                  </p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: questionGrades[fa.question.id] ? '#2A2A2A' : '#C4BCB0' }}>
                    {questionGrades[fa.question.id] || '—'}
                  </p>
                </div>
              ))}
              <div style={{ textAlign: 'center', borderInlineStart: '1px solid #C4BCB0', paddingInlineStart: '24px' }}>
                <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A89E92', marginBottom: '4px' }}>
                  Total
                </p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#2A2A2A' }}>
                  {totalQuestionPoints}
                </p>
              </div>
            </div>
          )}

          {/* Final grade text field */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
            <input
              type="number"
              min="0"
              max="5"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="0"
              style={{
                width: '72px', padding: '12px', background: '#F5F0E8', border: '1px solid #D4CCC0',
                color: '#2A2A2A', fontSize: '2rem', textAlign: 'center', outline: 'none',
                fontFamily: 'var(--font-display)',
              }}
            />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#A89E92' }}>/</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#2A2A2A' }}>5</span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p className="label-caps" style={{ marginBottom: '8px' }}>{t('studentReview.feedback')}</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t('studentReview.feedbackPlaceholder')}
              rows={3}
              style={{
                width: '100%', padding: '14px 18px', background: '#F5F0E8', border: '1px solid #D4CCC0',
                color: '#2A2A2A', fontSize: '0.875rem', resize: 'vertical', outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <p className="label-caps" style={{ marginBottom: '8px' }}>{t('studentReview.internalNotes')}</p>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder={t('studentReview.notesPlaceholder')}
              rows={2}
              style={{
                width: '100%', padding: '14px 18px', background: '#F5F0E8', border: '1px solid #D4CCC0',
                color: '#2A2A2A', fontSize: '0.875rem', resize: 'vertical', outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleSubmitGrade('re_dialogue_requested')}
              disabled={submitting}
              style={{
                padding: '10px 20px', background: 'transparent', border: '1px solid #C4BCB0',
                fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em',
                color: '#A89E92', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2A2A2A'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#A89E92'; }}
            >
              {t('studentReview.reDialogue')}
            </button>
            <button
              onClick={() => handleSubmitGrade('overridden')}
              disabled={submitting}
              style={{
                padding: '10px 20px', background: 'transparent', border: '1px solid #C4BCB0',
                fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em',
                color: '#6A6A6A', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2A2A2A'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6A6A6A'; }}
            >
              {t('studentReview.override')}
            </button>
            <button
              onClick={() => handleSubmitGrade('approved')}
              disabled={submitting}
              style={{
                padding: '10px 28px', background: '#2A2A2A', border: '1px solid #2A2A2A',
                fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em',
                color: '#F5F0E8', cursor: 'pointer', transition: 'all 0.2s',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {submitting ? t('studentReview.submittingGrade') : t('studentReview.approveGrade')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
