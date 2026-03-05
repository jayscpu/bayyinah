import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import type { Course, Assignment, AssignmentSubmission } from '../../types';

type AssignmentWithStatus = {
  assignment: Assignment;
  courseName: string;
  submission: AssignmentSubmission | null;
};

export default function StudentAssignments() {
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
          // Check for existing submission
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
    <div className="animate-fade-in">
      <div className="flex justify-center mb-8">
        <img src="/assets/diamond.png" alt="" className="h-10 w-auto" />
      </div>

      <h1 className="font-serif text-3xl text-charcoal-800 tracking-wider uppercase text-center mb-1">
        Assignments
      </h1>

      <hr className="dotted-divider" />

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-warmgray-400 font-display italic text-lg">No assignments available</p>
        </div>
      ) : (
        <div className="timeline">
          {items.map(({ assignment, courseName, submission }) => {
            const isComplete = submission?.status === 'scored' || submission?.status === 'validated';
            const inProgress = submission && !isComplete;

            return (
              <div key={assignment.id} className="timeline-item">
                <div className="timeline-bullet">
                  <img src="/assets/diamond.png" alt="" />
                </div>
                <div className="timeline-bar">
                  <div className="flex-1">
                    <p className="font-serif text-sm text-charcoal-800">{assignment.title}</p>
                    <p className="text-xs text-warmgray-400 mt-0.5">{courseName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {submission?.ai_score !== null && submission?.ai_score !== undefined && (
                      <span className="font-display text-base text-charcoal-800">
                        {submission.ai_score.toFixed(0)}<span className="text-xs text-warmgray-400">/100</span>
                      </span>
                    )}
                    {isComplete ? (
                      <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider italic font-display">
                        complete
                      </span>
                    ) : inProgress ? (
                      <Link
                        to={`/student/assignment-submissions/${submission!.id}/dialogue`}
                        className="text-[0.65rem] text-charcoal-600 uppercase tracking-wider hover:text-charcoal-900 transition-colors"
                      >
                        Continue
                      </Link>
                    ) : (
                      <Link
                        to={`/student/assignments/${assignment.id}/submit`}
                        className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors"
                      >
                        Submit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
