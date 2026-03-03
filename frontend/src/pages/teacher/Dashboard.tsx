import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useAuthStore } from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
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

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex justify-between items-start">
        <div>
          <p className="label-caps mb-2">Teacher Dashboard</p>
          <h1 className="heading-display text-4xl text-charcoal-800">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-warmgray-400 text-sm mt-2">Manage your courses and exams</p>
        </div>
        <Link to="/teacher/courses">
          <Button variant="secondary">Manage Courses</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        <Card className="text-center py-8">
          <p className="heading-display text-5xl text-sage-500">{courses.length}</p>
          <p className="label-caps mt-2">Courses</p>
        </Card>
        <Card className="text-center py-8">
          <p className="heading-display text-5xl text-sage-500">{exams.length}</p>
          <p className="label-caps mt-2">Exams</p>
        </Card>
        <Card className="text-center py-8">
          <p className="heading-display text-5xl text-gold-500">
            {exams.filter((e) => e.status === 'published').length}
          </p>
          <p className="label-caps mt-2">Active Exams</p>
        </Card>
      </div>

      {/* Divider */}
      <div className="ornament-divider">
        <div className="ornament-diamond" />
      </div>

      {/* Exams */}
      <Card decorative>
        <h2 className="font-serif text-xl text-charcoal-800 mb-5">Your Exams</h2>
        {exams.length === 0 ? (
          <p className="text-warmgray-400 text-center py-6 font-display italic text-lg">
            No exams yet. Create a course and exam to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-4 paper-warm rounded-sm border border-warmgray-200">
                <div>
                  <p className="font-serif text-charcoal-800">{exam.title}</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">{exam.question_count} questions</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={
                    exam.status === 'published' ? 'success' :
                    exam.status === 'draft' ? 'warning' : 'default'
                  }>
                    {exam.status}
                  </Badge>
                  <Link to={`/teacher/exams/${exam.id}/review`}>
                    <Button size="sm" variant="secondary">Review</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
