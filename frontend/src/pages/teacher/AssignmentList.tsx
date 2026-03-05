import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import type { Course, Assignment } from '../../types';

export default function AssignmentList() {
  useLanguageStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const coursesRes = await api.get('/courses');
      setCourses(coursesRes.data);
      const all: Assignment[] = [];
      for (const course of coursesRes.data) {
        const res = await api.get(`/assignments?course_id=${course.id}`);
        all.push(...res.data);
      }
      setAssignments(all);
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.post(`/assignments/${id}/publish`);
      toast.success('Assignment published!');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to publish');
    }
  };

  const handleClose = async (id: string) => {
    try {
      await api.post(`/assignments/${id}/close`);
      toast.success('Assignment closed');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to close');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Assignment deleted');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const getCourseName = (courseId: string) =>
    courses.find((c) => c.id === courseId)?.title || 'Unknown';

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
          {t('nav.assignments')}
        </h1>
        <Link
          to="/teacher/assignments/create"
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
          + Create Assignment
        </Link>
      </div>

      {/* Full-width divider */}
      <div style={{ borderTop: '1px solid #2A2A2A', marginBottom: '0' }} />

      {assignments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p className="text-warmgray-400 font-display italic text-xl">No assignments yet</p>
          <Link
            to="/teacher/assignments/create"
            style={{ fontSize: '0.75rem', color: '#A89E92', marginTop: '8px', display: 'inline-block' }}
          >
            Create your first assignment
          </Link>
        </div>
      ) : (
        <div style={{ paddingTop: '28px' }}>
          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#A89E92', marginBottom: '16px' }}>
            {assignments.length} {assignments.length !== 1 ? 'assignments' : 'assignment'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {assignments.map((a) => (
              <div
                key={a.id}
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
                    {a.title}
                  </p>
                  <p style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {getCourseName(a.course_id)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {a.status}
                  </span>

                  {a.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(a.id)}
                      style={{ fontSize: '0.6rem', color: '#4A4A4A', textTransform: 'uppercase', letterSpacing: '0.12em', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Publish
                    </button>
                  )}

                  {a.status === 'published' && (
                    <>
                      <Link
                        to={`/teacher/assignments/${a.id}/review`}
                        style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em', textDecoration: 'none' }}
                      >
                        Review
                      </Link>
                      <button
                        onClick={() => handleClose(a.id)}
                        style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Close
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(a.id)}
                    className="hover:text-red-400 transition-colors"
                    style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Delete
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
