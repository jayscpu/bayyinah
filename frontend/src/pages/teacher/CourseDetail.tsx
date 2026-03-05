import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../config/api';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';

interface CourseStats {
  course: { id: string; title: string; description: string | null };
  student_count: number;
  students: { id: string; full_name: string; email: string }[];
  exam_stats: {
    id: string;
    title: string;
    status: string;
    total_sessions: number;
    completed: number;
    pending_review: number;
    validated: number;
  }[];
  pending_reviews: {
    session_id: string;
    exam_id: string;
    exam_title: string;
    student_name: string;
    student_id: string;
    status: string;
    ai_score: number | null;
    completed_at: string | null;
  }[];
}

export default function CourseDetail() {
  useLanguageStore();
  const { courseId } = useParams<{ courseId: string }>();
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/${courseId}/stats`)
      .then((res) => setStats(res.data))
      .catch((err) => console.error('Failed to load course stats', err))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!stats) {
    return <div className="text-center py-20 text-warmgray-400 font-display italic">{t('courseDetail.courseNotFound')}</div>;
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <h1 className="font-serif text-3xl text-charcoal-800 tracking-wider uppercase mb-1">
        {stats.course.title}
      </h1>
      {stats.course.description && (
        <p className="text-xs text-warmgray-400 mb-2">{stats.course.description}</p>
      )}
      <p className="text-xs text-warmgray-400">
        {stats.student_count} {t('courseDetail.students')} &middot; {stats.exam_stats.length} {t('courseDetail.exams')}
      </p>

      <hr className="dotted-divider" />

      {/* Pending Reviews */}
      {stats.pending_reviews.length > 0 && (
        <>
          <p className="label-caps mb-4">{t('courseDetail.pendingReviews')}</p>
          <div className="timeline mb-8">
            {stats.pending_reviews.map((review) => (
              <div key={review.session_id} className="timeline-item">
                <div className="timeline-bullet">
                  <img src="/assets/diamond.png" alt="" />
                </div>
                <Link to={`/teacher/sessions/${review.session_id}/review`} className="block">
                  <div className="timeline-bar hover:bg-cream-300 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <p className="font-serif text-sm text-charcoal-800">{review.student_name}</p>
                      <p className="text-xs text-warmgray-400 mt-0.5">
                        {review.exam_title}
                        {review.completed_at && ` — ${new Date(review.completed_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {review.ai_score !== null && (
                        <div className="text-right">
                          <p className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">AI</p>
                          <p className="font-display text-lg text-charcoal-800">{review.ai_score.toFixed(0)}%</p>
                        </div>
                      )}
                      <span className="text-xs text-warmgray-400 uppercase tracking-wider">{t('courseDetail.grade')}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          <hr className="dotted-divider" />
        </>
      )}

      {/* Exams */}
      <p className="label-caps mb-4">{t('nav.exams')}</p>
      {stats.exam_stats.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-warmgray-400 font-display italic text-lg">{t('courseDetail.noExams')}</p>
        </div>
      ) : (
        <div className="timeline mb-8">
          {stats.exam_stats.map((exam) => (
            <div key={exam.id} className="timeline-item">
              <div className="timeline-bullet">
                <img src="/assets/diamond.png" alt="" />
              </div>
              <Link to={`/teacher/exams/${exam.id}/manage`} className="block">
                <div className="timeline-bar hover:bg-cream-300 transition-colors cursor-pointer">
                  <div className="flex-1">
                    <p className="font-serif text-sm text-charcoal-800">{exam.title}</p>
                    <p className="text-xs text-warmgray-400 mt-0.5">
                      {exam.total_sessions} {t('courseDetail.submissions')} &middot; {exam.completed} {t('dashboard.completed')} &middot; {exam.validated} {t('courseDetail.graded')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">
                      {exam.status}
                    </span>
                    {exam.pending_review > 0 && (
                      <span className="text-[0.6rem] text-charcoal-800 uppercase tracking-wider">
                        {exam.pending_review} {t('courseDetail.toReview')}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      <hr className="dotted-divider" />

      {/* Enrolled Students */}
      <p className="label-caps mb-4">{t('courseDetail.students')} ({stats.student_count})</p>
      {stats.students.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-warmgray-400 font-display italic">{t('courseDetail.noStudents')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stats.students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between px-4 py-3 bg-cream-200 border border-warmgray-200"
            >
              <div>
                <p className="font-serif text-sm text-charcoal-800">{student.full_name}</p>
                <p className="text-xs text-warmgray-400">{student.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
