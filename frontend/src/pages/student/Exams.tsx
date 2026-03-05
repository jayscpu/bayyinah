import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';
import type { Course, Exam } from '../../types';

export default function StudentExams() {
  useLanguageStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<{ exam: Exam; courseName: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
      const all: { exam: Exam; courseName: string }[] = [];
      for (const course of res.data) {
        const examRes = await api.get(`/exams?course_id=${course.id}`);
        for (const exam of examRes.data) {
          if (exam.status === 'published') {
            all.push({ exam, courseName: course.title });
          }
        }
      }
      setExams(all);
    } catch (err) {
      console.error('Failed to load exams', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

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
          {t('nav.exams')}
        </h1>
      </div>

      {/* Full-width divider */}
      <div style={{ borderTop: '1px solid #2A2A2A', marginBottom: '0' }} />

      {exams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p className="text-warmgray-400 font-display italic text-xl">No exams available</p>
          {courses.length === 0 && (
            <p style={{ fontSize: '0.75rem', color: '#A89E92', marginTop: '8px' }}>Enroll in a course first</p>
          )}
        </div>
      ) : (
        <div style={{ paddingTop: '28px' }}>
          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#A89E92', marginBottom: '16px' }}>
            {exams.length} {exams.length !== 1 ? 'exams' : 'exam'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {exams.map(({ exam, courseName }) => (
              <Link
                key={exam.id}
                to={`/student/exam/${exam.id}`}
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
                    {courseName} &middot; {exam.question_count} questions
                  </p>
                </div>
                <span style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Start
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
