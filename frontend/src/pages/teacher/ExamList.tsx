import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
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
      toast.success('Exam closed');
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
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <p className="label-caps mb-2">All Exams</p>
          <h1 className="heading-display text-4xl text-charcoal-800">Exams</h1>
        </div>
        <Link to="/teacher/exams/create">
          <Button>Create Exam</Button>
        </Link>
      </div>

      {exams.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-warmgray-400 font-display italic text-lg">No exams yet</p>
          <Link to="/teacher/exams/create" className="inline-block mt-4">
            <Button size="sm">Create Your First Exam</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-serif text-charcoal-800">{exam.title}</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">
                    {getCourseName(exam.course_id)} &middot; {exam.question_count} questions
                  </p>
                  {exam.description && (
                    <p className="text-xs text-warmgray-400 mt-1">{exam.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    exam.status === 'published' ? 'success' :
                    exam.status === 'draft' ? 'warning' : 'default'
                  }>
                    {exam.status}
                  </Badge>

                  <Link to={`/teacher/exams/${exam.id}/manage`}>
                    <Button size="sm" variant="secondary">Edit</Button>
                  </Link>

                  {exam.status === 'draft' && (
                    <Button size="sm" onClick={() => handlePublish(exam.id)}>
                      Publish
                    </Button>
                  )}

                  {exam.status === 'published' && (
                    <>
                      <Link to={`/teacher/exams/${exam.id}/review`}>
                        <Button size="sm" variant="secondary">Review</Button>
                      </Link>
                      <Button size="sm" variant="ghost" onClick={() => handleClose(exam.id)}>
                        Close
                      </Button>
                    </>
                  )}

                  <Button size="sm" variant="danger" onClick={() => handleDelete(exam.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
