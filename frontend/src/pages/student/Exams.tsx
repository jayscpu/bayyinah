import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import type { Course, Exam } from '../../types';

export default function StudentExams() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<{ exam: Exam; courseName: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
      const all: { exam: Exam; courseName: string }[] = [];
      for (const course of res.data) {
        const examRes = await api.get(`/exams?course_id=${course.id}`);
        for (const exam of examRes.data) {
          if (exam.status === 'published') {
            all.push({ exam, courseName: course.title });
          }
        }
      }
      setExams(all);
    } catch (err) {
      console.error('Failed to load exams', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-center mb-8">
        <img src="/assets/diamond.png" alt="" className="h-10 w-auto" />
      </div>

      <h1 className="font-serif text-3xl text-charcoal-800 tracking-wider uppercase text-center mb-1">Exams</h1>

      <hr className="dotted-divider" />

      {exams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-warmgray-400 font-display italic text-lg">No exams available</p>
          {courses.length === 0 && (
            <Link
              to="/student/courses"
              className="inline-block mt-3 text-xs text-warmgray-400 hover:text-charcoal-800 transition-colors"
            >
              Enroll in a course first
            </Link>
          )}
        </div>
      ) : (
        <div className="timeline">
          {exams.map(({ exam, courseName }) => (
            <div key={exam.id} className="timeline-item">
              <div className="timeline-bullet">
                <img src="/assets/diamond.png" alt="" />
              </div>
              <div className="timeline-bar">
                <div className="flex-1">
                  <p className="font-serif text-sm text-charcoal-800">{exam.title}</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">
                    {courseName} &middot; {exam.question_count} questions
                  </p>
                </div>
                <Link
                  to={`/student/exam/${exam.id}`}
                  className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors"
                >
                  Start
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
