import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
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
    return <div className="text-center py-20 text-warmgray-500 font-display italic text-lg">Course not found</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="label-caps mb-2">Course Overview</p>
          <h1 className="heading-display text-4xl text-charcoal-800">{stats.course.title}</h1>
          {stats.course.description && (
            <p className="text-warmgray-400 mt-2 text-sm">{stats.course.description}</p>
          )}
        </div>
        <Link to={`/teacher/exams/create?courseId=${courseId}`}>
          <Button>Create Exam</Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="text-center py-6">
          <p className="heading-display text-4xl text-sage-500">{stats.student_count}</p>
          <p className="label-caps mt-2">Students</p>
        </Card>
        <Card className="text-center py-6">
          <p className="heading-display text-4xl text-sage-500">{stats.exam_stats.length}</p>
          <p className="label-caps mt-2">Exams</p>
        </Card>
        <Card className="text-center py-6">
          <p className="heading-display text-4xl text-sage-500">
            {stats.exam_stats.reduce((a, e) => a + e.total_sessions, 0)}
          </p>
          <p className="label-caps mt-2">Submissions</p>
        </Card>
        <Card className="text-center py-6">
          <p className="heading-display text-4xl text-gold-500">
            {stats.pending_reviews.length}
          </p>
          <p className="label-caps mt-2">Pending Review</p>
        </Card>
      </div>

      {/* Pending Reviews */}
      {stats.pending_reviews.length > 0 && (
        <>
          <div className="ornament-divider">
            <div className="ornament-diamond" />
          </div>
          <Card decorative>
            <h2 className="font-serif text-xl text-charcoal-800 mb-5">Pending Reviews</h2>
            <div className="space-y-3">
              {stats.pending_reviews.map((review) => (
                <div key={review.session_id} className="flex items-center justify-between p-4 paper-warm rounded-sm border border-warmgray-200">
                  <div>
                    <p className="font-serif text-charcoal-800">{review.student_name}</p>
                    <p className="text-xs text-warmgray-400 mt-0.5">
                      {review.exam_title}
                      {review.completed_at && ` — ${new Date(review.completed_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {review.ai_score !== null && (
                      <span className="font-display text-sage-500 text-lg">
                        AI: {review.ai_score.toFixed(0)}/100
                      </span>
                    )}
                    <Badge variant={review.status === 'scored' ? 'warning' : 'info'}>
                      {review.status}
                    </Badge>
                    <Link to={`/teacher/sessions/${review.session_id}/review`}>
                      <Button size="sm">Grade</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Exams */}
      <Card>
        <h2 className="font-serif text-xl text-charcoal-800 mb-5">Exams</h2>
        {stats.exam_stats.length === 0 ? (
          <p className="text-warmgray-400 font-display italic text-center py-6">No exams yet</p>
        ) : (
          <div className="space-y-3">
            {stats.exam_stats.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-4 paper-warm rounded-sm border border-warmgray-200">
                <div>
                  <p className="font-serif text-charcoal-800">{exam.title}</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">
                    {exam.total_sessions} submissions &middot; {exam.completed} completed &middot; {exam.validated} graded
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    exam.status === 'published' ? 'success' :
                    exam.status === 'draft' ? 'warning' : 'default'
                  }>
                    {exam.status}
                  </Badge>
                  {exam.pending_review > 0 && (
                    <Badge variant="error">{exam.pending_review} to review</Badge>
                  )}
                  <Link to={`/teacher/exams/${exam.id}/manage`}>
                    <Button size="sm" variant="secondary">Manage</Button>
                  </Link>
                  {exam.total_sessions > 0 && (
                    <Link to={`/teacher/exams/${exam.id}/review`}>
                      <Button size="sm" variant="secondary">Review</Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Enrolled Students */}
      <Card>
        <h2 className="font-serif text-xl text-charcoal-800 mb-5">
          Enrolled Students ({stats.student_count})
        </h2>
        {stats.students.length === 0 ? (
          <p className="text-warmgray-400 font-display italic text-center py-6">No students enrolled yet</p>
        ) : (
          <div className="space-y-2">
            {stats.students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 paper-warm rounded-sm border border-warmgray-200">
                <div>
                  <p className="font-serif text-charcoal-800 text-sm">{student.full_name}</p>
                  <p className="text-xs text-warmgray-400">{student.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
