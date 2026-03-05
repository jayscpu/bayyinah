import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../config/api';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';
import type { Exam, ExamSession } from '../../types';

export default function ExamReview() {
  useLanguageStore();
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [examId]);

  const loadData = async () => {
    try {
      const [examRes, sessionsRes] = await Promise.all([
        api.get(`/exams/${examId}`),
        api.get(`/exams/${examId}/sessions`),
      ]);
      setExam(examRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      console.error('Failed to load exam review data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!exam) {
    return <div className="text-center py-20 text-warmgray-400 font-display italic">{t('exam.notFound')}</div>;
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <h1 className="font-serif text-2xl text-charcoal-800 tracking-wider uppercase mb-1">
        {exam.title}
      </h1>
      <p className="text-xs text-warmgray-400 mb-4">{t('examReview.reviewSubmissions')}</p>

      <hr className="dotted-divider" />

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-warmgray-400 font-display italic text-lg">{t('examReview.noSubmissions')}</p>
        </div>
      ) : (
        <div className="timeline">
          {sessions.map((session) => (
            <div key={session.id} className="timeline-item">
              <div className="timeline-bullet">
                <img src="/assets/diamond.png" alt="" />
              </div>
              <Link to={`/teacher/sessions/${session.id}/review`} className="block">
                <div className="timeline-bar hover:bg-cream-300 transition-colors cursor-pointer">
                  <div className="flex-1">
                    <p className="font-serif text-sm text-charcoal-800">
                      {session.student_name || `${t('examReview.student')} ${session.student_id.substring(0, 8)}...`}
                    </p>
                    <p className="text-xs text-warmgray-400 mt-0.5">
                      {session.completed_at
                        ? `${t('examReview.submittedDate')} ${new Date(session.completed_at).toLocaleDateString()}`
                        : `${t('examReview.startedDate')} ${new Date(session.started_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {session.ai_score !== null && (
                      <div className="text-right">
                        <p className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">{t('examReview.agentGrade')}</p>
                        <p className="font-display text-xl text-charcoal-800">{session.ai_score.toFixed(0)}%</p>
                      </div>
                    )}
                    <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">
                      {session.status === 'validated' ? t('examReview.graded') :
                       session.status === 'scored' ? t('examReview.review') :
                       session.status === 'completed' ? t('examReview.pending') : session.status}
                    </span>
                  </div>
                </div>
              </Link>

              {/* AI criterion scores inline */}
              {session.ai_criterion_scores && (
                <div className="ml-0 mt-1 grid grid-cols-4 gap-1">
                  {Object.entries(session.ai_criterion_scores).filter(([k]) => k !== 'summary').map(([key, val]: [string, any]) => (
                    <div key={key} className="px-2 py-1 bg-cream-50 border border-warmgray-200 text-center">
                      <p className="text-[0.55rem] text-warmgray-400 uppercase tracking-wider">{key}</p>
                      <p className="font-display text-sm text-charcoal-800">{val?.score ?? '—'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
