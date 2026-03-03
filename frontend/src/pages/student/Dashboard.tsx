import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useAuthStore } from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import type { Course, Exam } from '../../types';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Record<string, Exam[]>>({});
  const [loading, setLoading] = useState(true);
  const [enrollCode, setEnrollCode] = useState('');

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

  const handleEnroll = async () => {
    if (!enrollCode.trim()) return;
    try {
      await api.post(`/courses/${enrollCode.trim()}/enroll`);
      await loadData();
      setEnrollCode('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Enrollment failed');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-2">Student Dashboard</p>
        <h1 className="heading-display text-4xl text-charcoal-800">
          Welcome, {user?.full_name}
        </h1>
        <p className="text-warmgray-400 text-sm mt-2">Your enrolled courses and available exams</p>
      </div>

      {/* Enroll in course */}
      <Card>
        <h2 className="font-serif text-lg text-charcoal-800 mb-3">Enroll in a Course</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={enrollCode}
            onChange={(e) => setEnrollCode(e.target.value)}
            placeholder="Enter course ID"
            className="flex-1 px-4 py-2 bg-cream-50 border border-warmgray-200 rounded-sm text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-sage-500"
          />
          <Button onClick={handleEnroll} size="sm">Enroll</Button>
        </div>
      </Card>

      {courses.length === 0 ? (
        <Card className="text-center py-12">
          <p className="font-display italic text-lg text-warmgray-400">No courses yet</p>
          <p className="text-warmgray-400 text-xs mt-2">
            Ask your teacher for a course ID to enroll
          </p>
        </Card>
      ) : (
        courses.map((course) => (
          <Card key={course.id} decorative>
            <h2 className="font-serif text-xl text-charcoal-800">{course.title}</h2>
            {course.description && (
              <p className="text-warmgray-400 text-sm mt-1">{course.description}</p>
            )}

            <div className="mt-5 space-y-3">
              {(exams[course.id] || []).length === 0 ? (
                <p className="text-warmgray-400 text-sm font-display italic">No exams available yet</p>
              ) : (
                (exams[course.id] || []).map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-4 paper-warm rounded-sm border border-warmgray-200">
                    <div>
                      <p className="font-serif text-charcoal-800">{exam.title}</p>
                      <p className="text-xs text-warmgray-400 mt-0.5">{exam.question_count} questions</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="success">{exam.status}</Badge>
                      <Link to={`/student/exam/${exam.id}`}>
                        <Button size="sm">Start Exam</Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
