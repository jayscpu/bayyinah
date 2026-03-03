import { useEffect, useState } from 'react';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
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
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-2">Academic Record</p>
        <h1 className="heading-display text-4xl text-charcoal-800">My Results</h1>
        <p className="text-warmgray-400 text-sm mt-2">Grades are visible after teacher validation</p>
      </div>

      {results.length === 0 ? (
        <Card className="text-center py-12">
          <p className="font-display italic text-lg text-warmgray-400">No results yet</p>
          <p className="text-warmgray-400 text-xs mt-2">Complete an exam to see your results here</p>
        </Card>
      ) : (
        results.map((item) => (
          <Card key={item.session.id} decorative>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-serif text-xl text-charcoal-800">{item.exam.title}</h2>
                <p className="text-xs text-warmgray-400 mt-1">{item.course.title}</p>
              </div>
              <Badge variant={
                item.session.status === 'validated' ? 'success' :
                item.session.status === 'scored' ? 'warning' :
                item.session.status === 'completed' ? 'info' : 'default'
              }>
                {item.session.status === 'validated' ? 'Graded' :
                 item.session.status === 'scored' ? 'Under Review' :
                 item.session.status === 'completed' ? 'Submitted' : 'In Progress'}
              </Badge>
            </div>

            {item.grade ? (
              <div className="mt-6">
                <div className="text-center py-6">
                  <div className="heading-display text-7xl text-sage-500">
                    {item.grade.final_grade}
                    <span className="text-3xl text-warmgray-300">/5</span>
                  </div>
                  <p className="text-warmgray-400 mt-2 font-display italic text-lg">
                    {gradeLabels[item.grade.final_grade]}
                  </p>
                </div>

                {item.grade.feedback && (
                  <div className="mt-4 p-5 paper-warm rounded-sm border border-warmgray-200">
                    <p className="label-caps text-[0.6rem] mb-2">Teacher Feedback</p>
                    <p className="text-charcoal-800 text-sm leading-relaxed">{item.grade.feedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 text-center py-6">
                <div className="ornament-divider mb-4">
                  <div className="ornament-diamond" />
                </div>
                <p className="text-warmgray-400 font-display italic">
                  Awaiting teacher review
                </p>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
