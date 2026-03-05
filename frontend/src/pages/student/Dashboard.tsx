import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';
import type { Course, Exam, ExamSession, Assignment } from '../../types';

type StreamItem = { id: string; text: string; subtitle: string; link: string; };

export default function StudentDashboard() {
  const { lang } = useLanguageStore();
  const { user } = useAuthStore();
  const displayName = lang === 'ar'
    ? (user?.name_ar || user?.name_en || user?.full_name)
    : (user?.name_en || user?.name_ar || user?.full_name);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Record<string, Exam[]>>({});
  const [assignments, setAssignments] = useState<{ assignment: Assignment; courseName: string }[]>([]);
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
      const assignmentList: { assignment: Assignment; courseName: string }[] = [];
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

        const assignRes = await api.get(`/assignments?course_id=${course.id}`);
        for (const assignment of assignRes.data as Assignment[]) {
          assignmentList.push({ assignment, courseName: course.title });
        }
      }

      setExams(examsMap);
      setAssignments(assignmentList);
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
  const streamItems: StreamItem[] = [];
  for (const course of courses) {
    for (const exam of (exams[course.id] || [])) {
      streamItems.push({
        id: `exam-${exam.id}`,
        text: `${t('dashboard.newExam')} ${exam.title} – ${course.title} ${t('dashboard.published')}`,
        subtitle: `${course.title} · ${exam.question_count} ${exam.question_count !== 1 ? t('dashboard.questions') : t('dashboard.question')}`,
        link: `/student/exam/${exam.id}`,
      });
    }
  }
  for (const { assignment, courseName } of assignments) {
    streamItems.push({
      id: `assignment-${assignment.id}`,
      text: `New assignment: ${assignment.title} – ${courseName} published`,
      subtitle: `${courseName} · Assignment`,
      link: `/student/assignments/${assignment.id}/submit`,
    });
  }

  return (
    <div className="animate-fade-in">
      {/* Diamond ornament — centered */}
      <div className="flex justify-center mb-8">
        <img src="/assets/diamond.png" alt="" className="h-10 w-auto" />
      </div>

      {/* Welcome */}
      <h1 className="font-display text-[2.75rem] text-charcoal-800 text-center leading-tight">
        {t('dashboard.welcome')} {displayName}
      </h1>

      {/* Colored dotted divider */}
      <hr className="dotted-divider my-6" />

      {/* Summary cards */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <p className="dashboard-card-value">{Object.values(exams).flat().length}</p>
          <p className="dashboard-card-label">{t('dashboard.exams')}</p>
        </div>
        <div className="dashboard-card">
          <p className="dashboard-card-value">{inProgressCount}</p>
          <p className="dashboard-card-label">{t('dashboard.inProgress')}</p>
        </div>
        <div className="dashboard-card">
          <p className="dashboard-card-value">{completedCount}</p>
          <p className="dashboard-card-label">{t('dashboard.completed')}</p>
        </div>
      </div>

      {/* STREAM label */}
      <p className="label-caps mb-5">{t('dashboard.stream')}</p>

      {/* Timeline */}
      {streamItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-warmgray-400 font-display italic text-xl">{t('dashboard.noNotifications')}</p>
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
                    <p className="text-xs text-charcoal-500 mt-1">{item.subtitle}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
