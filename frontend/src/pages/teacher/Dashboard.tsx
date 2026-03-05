import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';
import type { Course, Exam } from '../../types';

export default function TeacherDashboard() {
  const { lang } = useLanguageStore();
  const { user } = useAuthStore();
  const displayName = lang === 'ar'
    ? (user?.name_ar || user?.name_en || user?.full_name)
    : (user?.name_en || user?.name_ar || user?.full_name);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
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

      // Count sessions awaiting teacher review (status = 'scored')
      let pending = 0;
      const publishedExams = allExams.filter((e) => e.status === 'published' || e.status === 'closed');
      await Promise.all(publishedExams.map(async (exam) => {
        try {
          const sessionsRes = await api.get(`/exams/${exam.id}/sessions`);
          pending += sessionsRes.data.filter((s: { status: string }) => s.status === 'scored').length;
        } catch {
          // ignore per-exam errors
        }
      }));
      setPendingReviewsCount(pending);
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
        {t('teacherDash.welcome')} {displayName}
      </h1>

      {/* Colored dotted divider */}
      <hr className="dotted-divider my-6" />

      {/* Summary cards */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <p className="dashboard-card-value">{courses.length}</p>
          <p className="dashboard-card-label">{t('dashboard.courses')}</p>
        </div>
        <div className="dashboard-card">
          <p className="dashboard-card-value">{exams.length}</p>
          <p className="dashboard-card-label">{t('teacherDash.exams')}</p>
        </div>
        <div className="dashboard-card">
          <p className="dashboard-card-value">{pendingReviewsCount}</p>
          <p className="dashboard-card-label">{t('teacherDash.pendingReviews')}</p>
        </div>
      </div>

      {/* Stream label */}
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
