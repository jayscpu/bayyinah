import { useEffect, useState } from 'react';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import type { Course, Exam, ExamSession, TeacherGrade } from '../../types';

interface ResultItem {
  exam: Exam;
  course: Course;
  session: ExamSession;
  grade: TeacherGrade | null;
}

export default function Results() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error('Failed to load results', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const gradeLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Below Average',
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
  };

  return (
    <div className="animate-fade-in">
      {/* Diamond ornament */}
      <div className="flex justify-center mb-8">
        <img src="/assets/diamond.png" alt="" className="h-10 w-auto" />
      </div>

      <h1 className="font-display text-[2.75rem] text-charcoal-800 text-center leading-tight">
        Results
      </h1>
      <p className="text-xs text-warmgray-400 text-center mt-2">Grades visible after teacher validation</p>

      <hr className="dotted-divider my-6" />

      {results.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display italic text-xl text-warmgray-400">No results yet</p>
          <p className="text-warmgray-400 text-xs mt-3">Complete an exam to see your results here</p>
        </div>
      ) : (
        <div className="timeline">
          {results.map((item) => (
            <div key={item.session.id} className="timeline-item">
              <div className="timeline-bullet">
                <img src="/assets/diamond.png" alt="" />
              </div>

              {/* Date above bar */}
              {item.session.completed_at && (
                <p className="text-[0.65rem] text-charcoal-600 text-right mb-1">
                  {new Date(item.session.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                </p>
              )}

              <div className="timeline-bar">
                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm text-charcoal-800">
                    {item.exam.title} – {item.course.title}
                  </p>
                  {item.session.completed_at && (
                    <p className="text-xs text-warmgray-400 mt-0.5">
                      Submitted: {new Date(item.session.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                  {item.grade?.feedback && (
                    <p className="text-xs text-warmgray-500 mt-1 italic">
                      Instructor Note: {item.grade.feedback}
                    </p>
                  )}
                </div>

                {/* Right: Agent Grade | Final Grade */}
                <div className="flex items-center gap-0 shrink-0">
                  {item.session.ai_score !== null && (
                    <div className="text-center px-4">
                      <p className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">Agent Grade</p>
                      <p className="font-display text-2xl text-charcoal-800">{item.session.ai_score.toFixed(0)}%</p>
                    </div>
                  )}

                  {/* Vertical separator */}
                  {item.session.ai_score !== null && (item.grade || item.session.status !== 'in_progress') && (
                    <div className="w-px h-10 bg-warmgray-400 mx-2" />
                  )}

                  {item.grade ? (
                    <div className="text-center px-4">
                      <p className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">Final Grade</p>
                      <p className="font-display text-2xl text-charcoal-800">
                        {item.grade.final_grade}/5
                      </p>
                      <p className="text-[0.55rem] text-warmgray-400 italic">
                        {gradeLabels[item.grade.final_grade]}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center px-4">
                      <p className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">Status</p>
                      <p className="text-xs text-warmgray-400 italic mt-1">
                        {item.session.status === 'scored' ? 'Under Review' :
                         item.session.status === 'completed' ? 'Submitted' : 'In Progress'}
                      </p>
                    </div>
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
