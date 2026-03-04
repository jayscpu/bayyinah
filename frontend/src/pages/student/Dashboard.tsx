import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useAuthStore } from '../../stores/authStore';
import Spinner from '../../components/ui/Spinner';
import type { Course, Exam, ExamSession } from '../../types';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Record<string, Exam[]>>({});
  const [completedCount, setCompletedCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);

      const examsMap: Record<string, Exam[]> = {};
      let completed = 0;
      let inProgress = 0;

      for (const course of res.data) {
        const examRes = await api.get(`/exams?course_id=${course.id}`);
        examsMap[course.id] = examRes.data;

        for (const exam of examRes.data) {
          try {
            const sessionRes = await api.get(`/exams/${exam.id}/sessions/me`);
            const session: ExamSession = sessionRes.data;
            if (session.status === 'in_progress') inProgress++;
            else if (['completed', 'scored', 'validated'].includes(session.status)) completed++;
          } catch {
            // no session for this exam yet
          }
        }
      }

      setExams(examsMap);
      setCompletedCount(completed);
      setInProgressCount(inProgress);
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

      {/* Summary cards */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <p className="dashboard-card-value">{courses.length}</p>
          <p className="dashboard-card-label">Courses</p>
        </div>
        <div className="dashboard-card">
          <p className="dashboard-card-value">{completedCount}</p>
          <p className="dashboard-card-label">Completed</p>
        </div>
        <div className="dashboard-card">
          <p className="dashboard-card-value">{inProgressCount}</p>
          <p className="dashboard-card-label">In Progress</p>
        </div>
      </div>

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
                <div className="timeline-bar transition-colors cursor-pointer">
                  <div className="flex-1">
                    <p className="font-serif text-sm text-charcoal-800 leading-relaxed">
                      {item.text}
                    </p>
                    <p className="text-xs text-charcoal-500 mt-1">
                      {item.course} &middot; {item.questions} question{item.questions !== 1 ? 's' : ''}
                    </p>
                  </div>
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
