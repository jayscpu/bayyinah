import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useAuthStore } from '../../stores/authStore';
import Spinner from '../../components/ui/Spinner';
import type { Course, Exam } from '../../types';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Record<string, Exam[]>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);

      const examsMap: Record<string, Exam[]> = {};
      for (const course of res.data) {
        const examRes = await api.get(`/exams?course_id=${course.id}`);
        examsMap[course.id] = examRes.data;
      }
      setExams(examsMap);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  // Build stream items
  const streamItems: { id: string; text: string; course: string; questions: number; link: string; date: string }[] = [];
  for (const course of courses) {
    for (const exam of (exams[course.id] || [])) {
      streamItems.push({
        id: exam.id,
        text: `New exam titled ${exam.title} – ${course.title} has been published.`,
        course: course.title,
        questions: exam.question_count,
        link: `/student/exam/${exam.id}`,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' }),
      });
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Diamond ornament — centered */}
      <div className="flex justify-center mb-8">
        <img src="/assets/diamond.png" alt="" className="h-10 w-auto" />
      </div>

      {/* Welcome */}
      <h1 className="font-display text-[2.75rem] text-charcoal-800 text-center leading-tight">
        Welcome, {user?.full_name}
      </h1>

      {/* Colored dotted divider */}
      <hr className="dotted-divider my-6" />

      {/* STREAM label */}
      <p className="label-caps mb-5">Stream</p>

      {/* Timeline */}
      {streamItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-warmgray-400 font-display italic text-xl">No notifications yet</p>
        </div>
      ) : (
        <div className="timeline">
          {streamItems.map((item) => (
            <div key={item.id} className="timeline-item">
              <div className="timeline-bullet">
                <img src="/assets/diamond.png" alt="" />
              </div>
              <Link to={item.link} className="block">
                <div className="timeline-bar hover:bg-warmgray-300 transition-colors cursor-pointer">
                  <p className="font-serif text-sm text-charcoal-800 flex-1 leading-relaxed">
                    {item.text}
                  </p>
                  <span className="text-xs text-charcoal-600 shrink-0 ml-4">{item.date}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
