import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import type { Course, Exam } from '../../types';

export default function StudentCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Record<string, Exam[]>>({});
  const [loading, setLoading] = useState(true);
  const [enrollCode, setEnrollCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
      if (res.data.length > 0) setSelectedId(res.data[0].id);

      const examsMap: Record<string, Exam[]> = {};
      for (const course of res.data) {
        const examRes = await api.get(`/exams?course_id=${course.id}`);
        examsMap[course.id] = examRes.data;
      }
      setExams(examsMap);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!enrollCode.trim()) return;
    setEnrolling(true);
    setEnrollError('');
    try {
      await api.post(`/courses/${enrollCode.trim()}/enroll`);
      await loadData();
      setEnrollCode('');
      setShowModal(false);
    } catch (err: any) {
      setEnrollError(err.response?.data?.detail || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEnrollCode('');
    setEnrollError('');
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const filtered = courses;
  const selected = courses.find((c) => c.id === selectedId) ?? null;
  const selectedExams = selected ? (exams[selected.id] || []) : [];

  return (
    /*
     * Break out of AppShell's max-w-[900px] container to fill the full
     * available area (sidebar-to-right-edge minus 40px padding each side).
     * Formula: marginLeft = min(570px - 50vw, 8px)  — see derivation in code comments
     * width   = 100vw - 240px  (viewport minus sidebar 160px minus 2×40px padding)
     */
    <div
      className="animate-fade-in"
      style={{
        marginLeft: 'min(calc(570px - 50vw), 8px)',
        width: 'calc(100vw - 240px)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 className="font-display text-[2.75rem] text-charcoal-800 leading-tight">
          Courses
        </h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '6px 18px',
            background: 'transparent',
            border: '1px solid #C4BCB0',
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#4A4A4A',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2A2A2A'; (e.currentTarget as HTMLButtonElement).style.color = '#2A2A2A'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#C4BCB0'; (e.currentTarget as HTMLButtonElement).style.color = '#4A4A4A'; }}
        >
          + Enroll
        </button>
      </div>

      {/* Full-width divider */}
      <div style={{ borderTop: '1px solid #2A2A2A', marginBottom: '0' }} />

      {courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p className="text-warmgray-400 font-display italic text-xl">No courses yet</p>
          <p className="text-xs text-warmgray-400 mt-2 uppercase tracking-wider">Click Enroll to get started</p>
        </div>
      ) : (
        /* Two-column layout — full width */
        <div style={{ display: 'flex' }}>

          {/* Left panel — course list */}
          <div style={{ width: '35%', borderRight: '1px solid #D4CCC0', paddingTop: '28px', flexShrink: 0 }}>
            <p style={{ padding: '0 24px 12px', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#A89E92' }}>
              {filtered.length} course{filtered.length !== 1 ? 's' : ''}
            </p>

            <div>
              {filtered.map((course) => {
                const isSelected = course.id === selectedId;
                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedId(course.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 24px',
                      background: isSelected ? '#E8DECE' : 'transparent',
                      border: 'none',
                      borderLeft: isSelected ? '3px solid #2A2A2A' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#E8DECE'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem', color: '#2A2A2A', marginBottom: '3px' }}>
                      {course.title}
                    </p>
                    <p style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {(exams[course.id] || []).length} exam{(exams[course.id] || []).length !== 1 ? 's' : ''}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel — selected course detail */}
          <div style={{ flex: 1, paddingTop: '28px', paddingLeft: '48px', paddingRight: '0' }}>
            {selected && (
              <div className="animate-fade-in">
                <h2 className="font-serif" style={{ fontSize: '1.5rem', color: '#2A2A2A', marginBottom: '8px', letterSpacing: '0.02em' }}>
                  {selected.title}
                </h2>
                {selected.description && (
                  <p style={{ fontSize: '0.875rem', color: '#A89E92', lineHeight: 1.7, marginBottom: '20px' }}>
                    {selected.description}
                  </p>
                )}
                <p style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '28px' }}>
                  ID: <span style={{ fontFamily: 'monospace' }}>{selected.id.substring(0, 8)}</span>
                </p>

                <div style={{ borderTop: '1px dotted #C4BCB0', paddingTop: '24px' }}>
                  <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#A89E92', marginBottom: '16px' }}>
                    Available Exams
                  </p>
                  {selectedExams.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#C4BCB0', fontStyle: 'italic', fontFamily: 'Cormorant Garamond, serif' }}>
                      No exams available yet
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedExams.map((exam) => (
                        <Link
                          key={exam.id}
                          to={`/student/exams/${exam.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 18px',
                            background: '#E8DECE',
                            border: '1px solid #D4CCC0',
                            textDecoration: 'none',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#DDD6C8'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DECE'; }}
                        >
                          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.875rem', color: '#2A2A2A' }}>
                            {exam.title}
                          </span>
                          <span style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                            Start →
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title="Enroll in a Course">
        <div>
          <label style={{ display: 'block', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-warmgray-400)', marginBottom: '0.5rem' }}>
            Course ID
          </label>
          <input
            type="text"
            value={enrollCode}
            onChange={(e) => { setEnrollCode(e.target.value); setEnrollError(''); }}
            placeholder="Paste your course ID here"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleEnroll(); }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'var(--color-cream-200)',
              border: '1px solid var(--color-warmgray-200)',
              outline: 'none',
              fontSize: '0.875rem',
              color: 'var(--color-charcoal-800)',
              fontFamily: 'var(--font-sans)',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-charcoal-600)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-warmgray-200)')}
          />
          {enrollError && (
            <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.4rem' }}>{enrollError}</p>
          )}

          <button
            onClick={handleEnroll}
            disabled={enrolling || !enrollCode.trim()}
            style={{
              width: '100%',
              marginTop: '1.25rem',
              padding: '0.75rem',
              background: 'var(--color-charcoal-800)',
              border: 'none',
              color: 'var(--color-cream-50)',
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: enrolling || !enrollCode.trim() ? 'not-allowed' : 'pointer',
              opacity: enrolling || !enrollCode.trim() ? 0.45 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {enrolling ? 'Joining...' : 'Join Course'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
