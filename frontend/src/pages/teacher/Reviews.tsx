import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import type { Course, Exam } from '../../types';

export default function Reviews() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const coursesRes = await api.get('/courses');
      setCourses(coursesRes.data);

      const allExams: Exam[] = [];
      for (const course of coursesRes.data) {
        const examsRes = await api.get(`/exams?course_id=${course.id}`);
        allExams.push(...examsRes.data);
      }
      setExams(allExams.filter((e) => e.status === 'published' || e.status === 'closed'));
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const getCourseName = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.title || 'Unknown';
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const pending = exams.filter((e) => e.status === 'published');
  const previous = exams.filter((e) => e.status === 'closed');

  return (
    <div className="animate-fade-in">
      <h1 className="font-serif text-3xl text-charcoal-800 tracking-wider uppercase text-center mb-2">
        Reviews
      </h1>

      <hr className="dotted-divider" />

      {/* Pending Reviews */}
      <p className="label-caps mb-4">Pending</p>

      {pending.length === 0 ? (
        <p className="text-warmgray-400 font-display italic text-center mb-8">No pending reviews</p>
      ) : (
        <div className="timeline mb-8">
          {pending.map((exam) => (
            <div key={exam.id} className="timeline-item">
              <div className="timeline-bullet">
                <img src="/assets/diamond.png" alt="" />
              </div>
              <Link to={`/teacher/exams/${exam.id}/review`} className="block">
                <div className="timeline-bar hover:bg-warmgray-300 transition-colors cursor-pointer">
                  <div className="flex-1">
                    <p className="font-serif text-sm text-charcoal-800">{exam.title}</p>
                    <p className="text-xs text-warmgray-400 mt-0.5">
                      {getCourseName(exam.course_id)} &middot; {exam.question_count} questions
                    </p>
                  </div>
                  <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">
                    {exam.submission_count ?? 0} submissions
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Previous Reviews */}
      <p className="label-caps mb-4">Previous</p>

      {previous.length === 0 ? (
        <p className="text-warmgray-400 font-display italic text-center">No previous reviews</p>
      ) : (
        <div className="timeline">
          {previous.map((exam) => (
            <div key={exam.id} className="timeline-item">
              <div className="timeline-bullet">
                <img src="/assets/diamond.png" alt="" />
              </div>
              <Link to={`/teacher/exams/${exam.id}/review`} className="block">
                <div className="timeline-bar hover:bg-warmgray-300 transition-colors cursor-pointer">
                  <div className="flex-1">
                    <p className="font-serif text-sm text-charcoal-800">{exam.title}</p>
                    <p className="text-xs text-warmgray-400 mt-0.5">
                      {getCourseName(exam.course_id)} &middot; {exam.question_count} questions
                    </p>
                  </div>
                  <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">
                    closed
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
