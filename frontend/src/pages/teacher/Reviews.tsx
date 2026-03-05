import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';
import type { Course, Exam } from '../../types';

export default function Reviews() {
  useLanguageStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const coursesRes = await api.get('/courses');
      setCourses(coursesRes.data);

      const allExams: Exam[] = [];
      for (const course of coursesRes.data) {
        const examsRes = await api.get(`/exams?course_id=${course.id}`);
        allExams.push(...examsRes.data);
      }
      setExams(allExams.filter((e) => e.status === 'published' || e.status === 'closed'));
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const getCourseName = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.title || 'Unknown';
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const pending = exams.filter((e) => e.status === 'published');
  const previous = exams.filter((e) => e.status === 'closed');

  return (
    <div
      className="animate-fade-in"
      style={{
        marginInlineStart: 'min(calc(570px - 50vw), 8px)',
        width: 'calc(100vw - 240px)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 className="font-display text-[2.75rem] text-charcoal-800 leading-tight">
          {t('reviews.title')}
        </h1>
      </div>

      {/* Full-width divider */}
      <div style={{ borderTop: '1px solid #2A2A2A', marginBottom: '0' }} />

      {/* Pending Reviews */}
      <div style={{ paddingTop: '28px' }}>
        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#A89E92', marginBottom: '16px' }}>
          {t('reviews.pending')}
        </p>

        {pending.length === 0 ? (
          <p className="text-warmgray-400 font-display italic" style={{ marginBottom: '40px' }}>{t('reviews.noPending')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
            {pending.map((exam) => (
              <Link
                key={exam.id}
                to={`/teacher/exams/${exam.id}/review`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 24px',
                  background: '#E8DECE',
                  border: '1px solid #D4CCC0',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#DDD6C8'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DECE'; }}
              >
                <div>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem', color: '#2A2A2A', marginBottom: '3px' }}>
                    {exam.title}
                  </p>
                  <p style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {getCourseName(exam.course_id)} &middot; {exam.question_count} {t('dashboard.questions')}
                  </p>
                </div>
                <span style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {exam.submission_count ?? 0} {t('reviews.submissions')}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Previous Reviews */}
        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#A89E92', marginBottom: '16px' }}>
          {t('reviews.previous')}
        </p>

        {previous.length === 0 ? (
          <p className="text-warmgray-400 font-display italic">{t('reviews.noPrevious')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {previous.map((exam) => (
              <Link
                key={exam.id}
                to={`/teacher/exams/${exam.id}/review`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 24px',
                  background: '#E8DECE',
                  border: '1px solid #D4CCC0',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#DDD6C8'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DECE'; }}
              >
                <div>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem', color: '#2A2A2A', marginBottom: '3px' }}>
                    {exam.title}
                  </p>
                  <p style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {getCourseName(exam.course_id)} &middot; {exam.question_count} {t('dashboard.questions')}
                  </p>
                </div>
                <span style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {t('reviews.closed')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
