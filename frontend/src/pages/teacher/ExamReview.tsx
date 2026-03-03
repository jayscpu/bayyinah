import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import type { Exam, ExamSession } from '../../types';

export default function ExamReview() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [examId]);

  const loadData = async () => {
    try {
      const [examRes, sessionsRes] = await Promise.all([
        api.get(`/exams/${examId}`),
        api.get(`/exams/${examId}/sessions`),
      ]);
      setExam(examRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      console.error('Failed to load exam review data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!exam) {
    return <div className="text-center py-20 text-warmgray-500 font-display italic text-lg">Exam not found</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-2">Exam Review</p>
        <h1 className="heading-display text-4xl text-charcoal-800">{exam.title}</h1>
        <p className="text-warmgray-400 text-sm mt-2">Review student submissions</p>
      </div>

      {sessions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-warmgray-400 font-display italic text-lg">No submissions yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-serif text-charcoal-800">
                    Student: {session.student_id.substring(0, 8)}...
                  </p>
                  <p className="text-xs text-warmgray-400 mt-0.5">
                    Started: {new Date(session.started_at).toLocaleDateString()}
                    {session.completed_at && ` — Completed: ${new Date(session.completed_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {session.ai_score !== null && (
                    <span className="font-display text-lg text-sage-500">
                      AI: {session.ai_score.toFixed(0)}/100
                    </span>
                  )}
                  <Badge variant={
                    session.status === 'validated' ? 'success' :
                    session.status === 'scored' ? 'warning' :
                    session.status === 'completed' ? 'info' : 'default'
                  }>
                    {session.status}
                  </Badge>
                  <Link to={`/teacher/sessions/${session.id}/review`}>
                    <Button size="sm">
                      {session.status === 'validated' ? 'View' : 'Grade'}
                    </Button>
                  </Link>
                </div>
              </div>

              {session.ai_criterion_scores && (
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  {Object.entries(session.ai_criterion_scores).filter(([k]) => k !== 'summary').map(([key, val]: [string, any]) => (
                    <div key={key} className="p-2 paper-warm rounded-sm border border-warmgray-200">
                      <p className="label-caps text-[0.6rem]">{key}</p>
                      <p className="font-display text-lg text-charcoal-800 mt-0.5">{val?.score ?? '—'}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
