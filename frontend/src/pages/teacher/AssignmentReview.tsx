import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import type { Assignment, AssignmentSubmission } from '../../types';

export default function AssignmentReview() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  const loadData = async () => {
    try {
      const [aRes, sRes] = await Promise.all([
        api.get(`/assignments/${assignmentId}`),
        api.get(`/assignments/${assignmentId}/submissions`),
      ]);
      setAssignment(aRes.data);
      setSubmissions(sRes.data);
    } catch (err) {
      console.error('Failed to load', err);
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
        {assignment?.title}
      </h1>
      {assignment?.description && (
        <p className="text-center text-sm text-warmgray-400 mt-1 max-w-xl mx-auto">
          {assignment.description}
        </p>
      )}

      <hr className="dotted-divider" />

      {submissions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-warmgray-400 font-display italic text-lg">No submissions yet</p>
        </div>
      ) : (
        <div className="timeline">
          {submissions.map((sub) => (
            <div key={sub.id} className="timeline-item">
              <div className="timeline-bullet">
                <img src="/assets/diamond.png" alt="" />
              </div>
              <div className="timeline-bar">
                <div className="flex-1">
                  <p className="font-serif text-sm text-charcoal-800">
                    {sub.student_name || sub.student_id.substring(0, 8)}
                  </p>
                  <p className="text-xs text-warmgray-400 mt-0.5">
                    {sub.original_filename || 'File submitted'}
                    {sub.submitted_at && (
                      <> &middot; {new Date(sub.submitted_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {sub.ai_score !== null && sub.ai_score !== undefined && (
                    <span className="font-display text-lg text-charcoal-800">
                      {sub.ai_score.toFixed(0)}
                      <span className="text-xs text-warmgray-400 ml-0.5">/ 100</span>
                    </span>
                  )}
                  <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">
                    {sub.status}
                  </span>
                  {sub.status !== 'pending' && sub.status !== 'in_progress' && (
                    <Link
                      to={`/teacher/assignment-submissions/${sub.id}/review`}
                      className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors"
                    >
                      Review
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
