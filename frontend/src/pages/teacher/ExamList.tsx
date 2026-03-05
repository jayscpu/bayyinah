import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import type { Course, Exam } from '../../types';

export default function ExamList() {
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
      setExams(allExams);
    } catch (err) {
      console.error('Failed to load exams', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (examId: string) => {
    try {
      await api.post(`/exams/${examId}/publish`);
      toast.success('Exam published!');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to publish');
    }
  };

  const handleClose = async (examId: string) => {
    try {
      await api.post(`/exams/${examId}/close`);
      toast.success('Exam ended');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to close');
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm(t('examList.confirmDelete'))) return;
    try {
      await api.delete(`/exams/${examId}`);
      toast.success('Exam deleted');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const getCourseName = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.title || 'Unknown';
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
          {t('examList.title')}
        </h1>
        <Link
          to="/teacher/exams/create"
          style={{
            padding: '6px 18px',
            background: 'transparent',
            border: '1px solid #C4BCB0',
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#4A4A4A',
            textDecoration: 'none',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#2A2A2A'; (e.currentTarget as HTMLAnchorElement).style.color = '#2A2A2A'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#C4BCB0'; (e.currentTarget as HTMLAnchorElement).style.color = '#4A4A4A'; }}
        >
          {t('examList.createExam')}
        </Link>
      </div>

      {/* Full-width divider */}
      <div style={{ borderTop: '1px solid #2A2A2A', marginBottom: '0' }} />

      {exams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p className="text-warmgray-400 font-display italic text-xl">{t('examList.noExams')}</p>
          <Link
            to="/teacher/exams/create"
            style={{ fontSize: '0.75rem', color: '#A89E92', marginTop: '8px', display: 'inline-block' }}
          >
            {t('examList.createFirst')}
          </Link>
        </div>
      ) : (
        <div style={{ paddingTop: '28px' }}>
          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#A89E92', marginBottom: '16px' }}>
            {exams.length} {exams.length !== 1 ? 'exams' : 'exam'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {exams.map((exam) => (
              <div
                key={exam.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 24px',
                  background: '#E8DECE',
                  border: '1px solid #D4CCC0',
                }}
              >
                <div>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem', color: '#2A2A2A', marginBottom: '3px' }}>
                    {exam.title}
                  </p>
                  <p style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {getCourseName(exam.course_id)} &middot; {exam.question_count} {t('dashboard.questions')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {exam.status}
                  </span>

                  <Link
                    to={`/teacher/exams/${exam.id}/manage`}
                    style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em', textDecoration: 'none' }}
                  >
                    {t('examList.edit')}
                  </Link>

                  {exam.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(exam.id)}
                      style={{ fontSize: '0.6rem', color: '#4A4A4A', textTransform: 'uppercase', letterSpacing: '0.12em', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {t('examList.publish')}
                    </button>
                  )}

                  {exam.status === 'published' && (
                    <>
                      <Link
                        to={`/teacher/exams/${exam.id}/review`}
                        style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em', textDecoration: 'none' }}
                      >
                        {t('examList.review')}
                      </Link>
                      <button
                        onClick={() => handleClose(exam.id)}
                        style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {t('examList.end')}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="hover:text-red-400 transition-colors"
                    style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {t('examList.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
