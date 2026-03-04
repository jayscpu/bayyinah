import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useAuthStore } from '../../stores/authStore';
import Spinner from '../../components/ui/Spinner';
import type { Course, Exam } from '../../types';

export default function TeacherDashboard() {
  const { user } = useAuthStore();
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
      setExams(allExams);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  // Build stream items
  const streamItems: { id: string; text: string; link: string; date: string }[] = [];
  for (const course of courses) {
    for (const exam of exams.filter((e) => e.course_id === course.id)) {
      streamItems.push({
        id: exam.id,
        text: `Exam "${exam.title}" – ${course.title} · ${exam.question_count} questions · ${exam.status}`,
        link: `/teacher/exams/${exam.id}/manage`,
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
        Welcome, Dr. {user?.full_name}
      </h1>

      {/* Colored dotted divider */}
      <hr className="dotted-divider my-6" />

      {/* Summary cards */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <p className="dashboard-card-value">{courses.length}</p>
          <p className="dashboard-card-label">Courses</p>
        </div>
        <div className="dashboard-card">
          <p className="dashboard-card-value">{exams.length}</p>
          <p className="dashboard-card-label">Exams</p>
        </div>
        <div className="dashboard-card">
          <p className="dashboard-card-value">{exams.reduce((s, e) => s + (e.question_count || 0), 0)}</p>
          <p className="dashboard-card-label">Questions</p>
        </div>
      </div>

      {/* Stream label */}
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
