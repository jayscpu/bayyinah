import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import type { Course, Exam } from '../../types';

export default function StudentCourses() {
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
      console.error('Failed to load courses', err);
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
    <div className="animate-fade-in">
      {/* Diamond ornament */}
      <div className="flex justify-center mb-8">
        <img src="/assets/diamond.png" alt="" className="h-10 w-auto" />
      </div>

      <h1 className="font-display text-[2.75rem] text-charcoal-800 text-center leading-tight">
        Courses
      </h1>

      <hr className="dotted-divider my-6" />

      {/* Enroll bar */}
      <div className="flex items-center gap-4 mb-12">
        <span className="label-caps shrink-0">Enroll</span>
        <div className="flex-1 flex items-stretch gap-3">
          <div className="flex-1 flex items-center bg-cream-200 border border-warmgray-200 px-6 py-4">
            <span className="text-sm text-warmgray-400 mr-3 shrink-0">ID:</span>
            <input
              type="text"
              value={enrollCode}
              onChange={(e) => setEnrollCode(e.target.value)}
              className="flex-1 bg-transparent text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none"
              placeholder=""
            />
          </div>
          <button
            onClick={handleEnroll}
            className="px-6 bg-cream-200 border border-warmgray-200 text-[0.65rem] uppercase tracking-[0.15em] text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors"
          >
            Join
          </button>
        </div>
      </div>

      {/* Course list */}
      <hr className="dotted-divider" />
      <p className="label-caps mb-8">My Courses</p>
      {courses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-warmgray-400 font-display italic text-xl">No courses yet</p>
          <p className="text-warmgray-400 text-xs mt-3">Enter a course ID above to enroll</p>
        </div>
      ) : (
        <div className="space-y-8">
          {courses.map((course) => (
            <div key={course.id} className="py-4">
              <div className="flex items-center gap-3 mb-3">
                <img src="/assets/diamond.png" alt="" className="h-6 w-6 shrink-0" />
                <p className="course-card-title">{course.title}</p>
              </div>
              {course.description && (
                <p className="course-card-desc mt-2 ml-9">{course.description}</p>
              )}
              <p className="text-[0.6rem] text-warmgray-400 mt-3 ml-9">
                {(exams[course.id] || []).length} exam{(exams[course.id] || []).length !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
