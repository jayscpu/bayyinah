import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import type { Course } from '../../types';

export default function ExamCreate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get('courseId') || '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(courseId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get('/courses').then((res) => setCourses(res.data));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/exams', {
        course_id: selectedCourse,
        title,
        description: description || null,
        weight_conceptual: 30,
        weight_interconnection: 25,
        weight_application: 25,
        weight_reasoning: 20,
      });
      toast.success('Exam created!');
      navigate(`/teacher/exams/${res.data.id}/manage`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create exam');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <p className="label-caps mb-2">New Exam</p>
        <h1 className="heading-display text-4xl text-charcoal-800">Create Exam</h1>
      </div>

      <Card decorative>
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-1.5">
            <label className="label-caps">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-cream-50 border border-warmgray-200 rounded-sm text-charcoal-800 text-sm focus:outline-none focus:border-sage-500 transition-colors"
            >
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <Input label="Exam Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm Exam" required />
          <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />

          {courses.length === 0 && (
            <p className="text-sm text-warmgray-400 font-display italic">
              Create a course first and upload materials before creating exams.
            </p>
          )}

          <Button type="submit" className="w-full" disabled={creating || !selectedCourse}>
            {creating ? <Spinner size="sm" /> : 'Create Exam'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
