import { useEffect, useState } from 'react';
import api from '../../config/api';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';
import type { Course, Exam, ExamSession, TeacherGrade } from '../../types';

interface ResultItem {
  exam: Exam;
  course: Course;
  session: ExamSession;
  grade: TeacherGrade | null;
}

export default function Results() {
  useLanguageStore();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const gradeLabels: Record<number, string> = {
    1: t('results.poor'), 2: t('results.belowAverage'), 3: t('results.average'), 4: t('results.good'), 5: t('results.excellent'),
  };

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const coursesRes = await api.get('/courses');
      const items: ResultItem[] = [];

      for (const course of coursesRes.data) {
        const examsRes = await api.get(`/exams?course_id=${course.id}`);
        for (const exam of examsRes.data) {
          try {
            const sessionRes = await api.get(`/exams/${exam.id}/sessions/me`);
            const session = sessionRes.data;

            let grade = null;
            if (session.status === 'validated') {
              const gradeRes = await api.get(`/sessions/${session.id}/grade`);
              grade = gradeRes.data;
            }

            items.push({ exam, course, session, grade });
          } catch {
            // No session for this exam
          }
        }
      }

      setResults(items);
      if (items.length > 0) setSelectedId(items[0].session.id);
    } catch (err) {
      console.error('Failed to load results', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const selected = results.find(r => r.session.id === selectedId) ?? null;

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
        <div>
          <h1 className="font-display text-[2.75rem] text-charcoal-800 leading-tight">{t('results.title')}</h1>
          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#A89E92', marginTop: '4px' }}>
            {t('results.gradesVisible')}
          </p>
        </div>
      </div>

      {/* Full-width divider */}
      <div style={{ borderTop: '1px solid #2A2A2A', marginBottom: '0' }} />

      {results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p className="font-display italic text-xl text-warmgray-400">{t('results.noResults')}</p>
          <p style={{ fontSize: '0.75rem', color: '#A89E92', marginTop: '8px' }}>{t('results.completeExam')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex' }}>

          {/* Left panel — result list */}
          <div style={{ width: '35%', borderInlineEnd: '1px solid #D4CCC0', paddingTop: '28px', flexShrink: 0 }}>
            <p style={{ padding: '0 24px 12px', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#A89E92' }}>
              {results.length} {results.length !== 1 ? t('courses.exams') : t('courses.exam')}
            </p>
            <div>
              {results.map((item) => {
                const isSelected = item.session.id === selectedId;
                const statusColor = item.grade ? '#5B6B4A' : item.session.status === 'scored' ? '#9C8E6E' : '#A89E92';
                return (
                  <button
                    key={item.session.id}
                    onClick={() => setSelectedId(item.session.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'start',
                      padding: '14px 24px',
                      background: isSelected ? '#E8DECE' : 'transparent',
                      border: 'none',
                      borderInlineStart: isSelected ? '3px solid #2A2A2A' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#E6E0D4'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.875rem', color: '#2A2A2A', marginBottom: '3px' }}>
                      {item.exam.title}
                    </p>
                    <p style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>
                      {item.course.title}
                    </p>
                    <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: statusColor }}>
                      {item.grade ? `${item.grade.final_grade}/5 · ${gradeLabels[item.grade.final_grade]}` :
                       item.session.status === 'scored' ? t('results.underReview') :
                       item.session.status === 'completed' ? t('results.submitted') : t('results.inProgress')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel — selected result detail */}
          <div style={{ flex: 1, paddingTop: '28px', paddingInlineStart: '48px', paddingInlineEnd: '0' }}>
            {selected && (
              <div className="animate-fade-in">
                <h2 className="font-serif" style={{ fontSize: '1.5rem', color: '#2A2A2A', marginBottom: '4px', letterSpacing: '0.02em' }}>
                  {selected.exam.title}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#A89E92', marginBottom: '20px' }}>
                  {selected.course.title}
                </p>

                {selected.session.completed_at && (
                  <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#A89E92', marginBottom: '24px' }}>
                    {t('results.submittedDate')} {new Date(selected.session.completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}

                <div style={{ borderTop: '1px dotted #C4BCB0', paddingTop: '24px', display: 'flex', gap: '40px' }}>
                  {/* Final Grade */}
                  {selected.grade ? (
                    <div>
                      <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#A89E92', marginBottom: '6px' }}>
                        {t('results.finalGrade')}
                      </p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: '#2A2A2A', lineHeight: 1 }}>
                        {selected.grade.final_grade}<span style={{ fontSize: '1.25rem', color: '#A89E92' }}>/5</span>
                      </p>
                      <p style={{ fontSize: '0.65rem', color: '#7A8B6A', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
                        {gradeLabels[selected.grade.final_grade]}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#A89E92', marginBottom: '6px' }}>
                        {t('results.status')}
                      </p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#2A2A2A', fontStyle: 'italic' }}>
                        {selected.session.status === 'scored' ? t('results.underReview') :
                         selected.session.status === 'completed' ? t('results.submitted') : t('results.inProgress')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Instructor feedback */}
                {selected.grade?.feedback && (
                  <div style={{ marginTop: '28px', padding: '16px 20px', background: '#E6E0D4', borderInlineStart: '2px solid #C4BCB0' }}>
                    <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#A89E92', marginBottom: '6px' }}>
                      {t('results.instructorNote')}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#3D3D3D', lineHeight: 1.7, fontStyle: 'italic' }}>
                      {selected.grade.feedback}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
