import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';
import type { Exam, ExamQuestion, ExamSession as Session, StudentAnswer } from '../../types';

export default function ExamSession() {
  useLanguageStore();
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<ExamQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [mcqSelections, setMcqSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initExam();
  }, [examId]);

  const initExam = async () => {
    try {
      const [examRes, questionsRes] = await Promise.all([
        api.get(`/exams/${examId}`),
        api.get(`/exams/${examId}/questions`),
      ]);
      setExam(examRes.data);
      setQuestions(questionsRes.data);

      const sessionRes = await api.post(`/exams/${examId}/sessions`);
      setSession(sessionRes.data);

      const answersRes = await api.get(`/sessions/${sessionRes.data.id}/answers`);
      setAnswers(answersRes.data);
    } catch (err) {
      console.error('Failed to initialize exam', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session || !activeQuestion) return;
    setSubmitting(true);
    try {
      const payload: any = { question_id: activeQuestion.id };
      if (activeQuestion.question_type === 'essay') {
        payload.answer_text = answerText;
      } else {
        payload.mcq_selections = Object.entries(mcqSelections)
          .filter(([, justification]) => justification.trim())
          .map(([key, justification]) => ({ key, justification }));
      }

      const res = await api.post(`/sessions/${session.id}/answers`, payload);
      setAnswers([...answers, res.data]);
      navigate(`/student/dialogue/${res.data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const isQuestionAnswered = (qId: string) => answers.some((a) => a.question_id === qId);
  const isQuestionDialogueComplete = (qId: string) => {
    const answer = answers.find((a) => a.question_id === qId);
    return answer && answer.dialogue_turns_completed >= 3;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!exam || !session) {
    return <div className="text-center py-20 text-warmgray-400 font-display italic">{t('exam.notFound')}</div>;
  }

  if (session.status !== 'in_progress') {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', paddingTop: '4rem', paddingBottom: '4rem' }}>
        <img src="/assets/diamond.png" alt="" style={{ height: '2.5rem', margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-charcoal-800)', marginBottom: '0.75rem' }}>
          {t('exam.examCompleted')}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-warmgray-400)', marginBottom: '2rem' }}>
          {t('exam.submittedForReview')}
        </p>
        <button
          onClick={() => navigate('/student/results')}
          style={{
            padding: '0.5rem 1.5rem',
            background: 'var(--color-cream-200)',
            border: '1px solid var(--color-warmgray-200)',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--color-charcoal-600)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-charcoal-900)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-charcoal-600)')}
        >
          {t('exam.viewResults')}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <h1 className="font-serif text-2xl text-charcoal-800 tracking-wider uppercase mb-1">{exam.title}</h1>
      <p className="text-xs text-warmgray-400 mb-8">
        {answers.filter((a) => a.dialogue_turns_completed >= 3).length} {t('exam.of')} {questions.length} {t('exam.completed')}
      </p>

      <hr className="dotted-divider" />

      {/* Question list */}
      {!activeQuestion ? (
        <div className="timeline mt-4">
          {questions.map((q) => {
            const answered = isQuestionAnswered(q.id);
            const complete = isQuestionDialogueComplete(q.id);
            const answer = answers.find((a) => a.question_id === q.id);

            return (
              <div key={q.id} className="timeline-item">
                <div className="timeline-bullet">
                  <img src="/assets/diamond.png" alt="" />
                </div>
                <div
                  className={`timeline-bar ${!complete ? 'cursor-pointer hover:bg-cream-300' : ''} transition-colors`}
                  onClick={() => {
                    if (complete) return;
                    if (answered && answer && answer.dialogue_turns_completed < 3) {
                      navigate(`/student/dialogue/${answer.id}`);
                    } else if (!answered) {
                      setActiveQuestion(q);
                      setAnswerText('');
                      setMcqSelections({});
                    }
                  }}
                >
                  <div className="flex-1">
                    <p className="font-serif text-sm text-charcoal-800 leading-relaxed">
                      Q{q.display_order}. {q.question_text}
                    </p>
                    <p className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider mt-2">
                      {q.question_type}
                    </p>
                  </div>
                  <span className="text-xs text-warmgray-400 uppercase tracking-wider ml-4">
                    {complete ? t('exam.done') : answered ? t('exam.continue') : t('exam.answer')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Active question */
        <div className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <p className="label-caps">{t('exam.questionNum')} {activeQuestion.display_order}</p>
            <button
              onClick={() => setActiveQuestion(null)}
              className="text-xs text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 cursor-pointer transition-colors"
            >
              {t('exam.back')}
            </button>
          </div>

          <p className="font-serif text-charcoal-800 text-lg mb-10 leading-[1.8]">
            {activeQuestion.question_text}
          </p>

          <hr className="dotted-divider" />

          {activeQuestion.question_type === 'essay' ? (
            <div className="mt-8">
              <p className="label-caps mb-4">{t('exam.yourAnswer')}</p>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder={t('exam.writePlaceholder')}
                className="w-full px-5 py-4 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 resize-y min-h-[180px] leading-[1.8]"
                rows={6}
              />
            </div>
          ) : (
            <div className="mt-8">
              <p className="label-caps mb-6">{t('exam.selectJustify')}</p>
              <div className="space-y-5">
                {activeQuestion.mcq_options?.map((opt) => (
                  <div
                    key={opt.key}
                    className={`bg-cream-200 border px-5 py-5 cursor-pointer transition-colors ${
                      opt.key in mcqSelections ? 'border-charcoal-600' : 'border-warmgray-200'
                    }`}
                    onClick={() => {
                      setMcqSelections((prev) => {
                        if (opt.key in prev) {
                          const { [opt.key]: _, ...rest } = prev;
                          return rest;
                        }
                        return { ...prev, [opt.key]: '' };
                      });
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={opt.key in mcqSelections}
                        readOnly
                        className="mt-1 accent-charcoal-800 pointer-events-none"
                      />
                      <span className="font-serif text-sm text-charcoal-800 leading-relaxed">
                        {opt.key}. {opt.text}
                      </span>
                    </div>
                    {opt.key in mcqSelections && (
                      <textarea
                        className="w-full mt-4 px-4 py-3 bg-cream-50 border border-warmgray-200 text-sm text-charcoal-800 placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 resize-none leading-[1.8]"
                        placeholder={t('exam.justifyPlaceholder')}
                        value={mcqSelections[opt.key]}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setMcqSelections((prev) => ({ ...prev, [opt.key]: e.target.value }))}
                        rows={2}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-end">
            <button
              onClick={handleSubmitAnswer}
              disabled={submitting}
              className="px-6 py-3 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors disabled:opacity-50"
            >
              {submitting ? t('exam.submitting') : t('exam.submitDialogue')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
