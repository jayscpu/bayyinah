import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import type { Course, Exam } from '../../types';

export default function ExamList() {
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
      console.error('Failed to load exams', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (examId: string) => {
    try {
      await api.post(`/exams/${examId}/publish`);
      toast.success('Exam published!');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to publish');
    }
  };

  const handleClose = async (examId: string) => {
    try {
      await api.post(`/exams/${examId}/close`);
      toast.success('Exam ended');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to close');
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      await api.delete(`/exams/${examId}`);
      toast.success('Exam deleted');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const getCourseName = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.title || 'Unknown';
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

      <h1 className="font-serif text-3xl text-charcoal-800 tracking-wider uppercase text-center mb-1">Exams</h1>
      <div className="flex justify-end mb-1">
        <Link
          to="/teacher/exams/create"
          className="text-xs text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors"
        >
          + Create Exam
        </Link>
      </div>

      <hr className="dotted-divider" />

      {exams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-warmgray-400 font-display italic text-lg">No exams yet</p>
          <Link
            to="/teacher/exams/create"
            className="inline-block mt-3 text-xs text-warmgray-400 hover:text-charcoal-800 transition-colors"
          >
            Create your first exam
          </Link>
        </div>
      ) : (
        <div className="timeline">
          {exams.map((exam) => (
            <div key={exam.id} className="timeline-item">
              <div className="timeline-bullet">
                <img src="/assets/diamond.png" alt="" />
              </div>
              <div className="timeline-bar">
                <div className="flex-1">
                  <p className="font-serif text-sm text-charcoal-800">{exam.title}</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">
                    {getCourseName(exam.course_id)} &middot; {exam.question_count} questions
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">
                    {exam.status}
                  </span>

                  <Link
                    to={`/teacher/exams/${exam.id}/manage`}
                    className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors"
                  >
                    Edit
                  </Link>

                  {exam.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(exam.id)}
                      className="text-[0.65rem] text-charcoal-600 uppercase tracking-wider hover:text-charcoal-900 transition-colors cursor-pointer"
                    >
                      Publish
                    </button>
                  )}

                  {exam.status === 'published' && (
                    <>
                      <Link
                        to={`/teacher/exams/${exam.id}/review`}
                        className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors"
                      >
                        Review
                      </Link>
                      <button
                        onClick={() => handleClose(exam.id)}
                        className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors cursor-pointer"
                      >
                        End
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
