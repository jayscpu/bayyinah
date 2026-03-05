import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';
import type { Course, Assignment, AssignmentSubmission } from '../../types';

type AssignmentWithStatus = {
  assignment: Assignment;
  courseName: string;
  submission: AssignmentSubmission | null;
};

export default function StudentAssignments() {
  useLanguageStore();
  const [items, setItems] = useState<AssignmentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const coursesRes = await api.get('/courses');
      const courses: Course[] = coursesRes.data;

      const all: AssignmentWithStatus[] = [];
      for (const course of courses) {
        const res = await api.get(`/assignments?course_id=${course.id}`);
        for (const assignment of res.data as Assignment[]) {
          let submission: AssignmentSubmission | null = null;
          try {
            const subRes = await api.get(`/assignments/${assignment.id}/submissions/me`);
            submission = subRes.data;
          } catch {
            // 404 = no submission yet
          }
          all.push({ assignment, courseName: course.title, submission });
        }
      }
      setItems(all);
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

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
      </div>

      {/* Full-width divider */}
      <div style={{ borderTop: '1px solid #2A2A2A', marginBottom: '0' }} />

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p className="text-warmgray-400 font-display italic text-xl">No assignments available</p>
        </div>
      ) : (
        <div style={{ paddingTop: '28px' }}>
          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#A89E92', marginBottom: '16px' }}>
            {items.length} {items.length !== 1 ? 'assignments' : 'assignment'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map(({ assignment, courseName, submission }) => {
              const isComplete = submission?.status === 'scored' || submission?.status === 'validated';
              const inProgress = submission && !isComplete;

              const linkTo = isComplete
                ? '#'
                : inProgress
                  ? `/student/assignment-submissions/${submission!.id}/dialogue`
                  : `/student/assignments/${assignment.id}/submit`;

              const actionLabel = isComplete ? 'Complete' : inProgress ? 'Continue' : 'Submit';

              return (
                <Link
                  key={assignment.id}
                  to={linkTo}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 24px',
                    background: '#E8DECE',
                    border: '1px solid #D4CCC0',
                    textDecoration: 'none',
                    transition: 'background 0.2s',
                    pointerEvents: isComplete ? 'none' : 'auto',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#DDD6C8'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E8DECE'; }}
                >
                  <div>
                    <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem', color: '#2A2A2A', marginBottom: '3px' }}>
                      {assignment.title}
                    </p>
                    <p style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {courseName}
                      {submission?.ai_score !== null && submission?.ai_score !== undefined && (
                        <> &middot; Score: {submission.ai_score.toFixed(0)}/100</>
                      )}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.6rem',
                    color: isComplete ? '#A89E92' : '#A89E92',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontStyle: isComplete ? 'italic' : 'normal',
                  }}>
                    {actionLabel}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
