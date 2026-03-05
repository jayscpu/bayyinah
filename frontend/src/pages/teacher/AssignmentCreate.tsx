import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import type { Course } from '../../types';

export default function AssignmentCreate() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses').then((res) => {
      setCourses(res.data);
      if (res.data.length > 0) setCourseId(res.data[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !courseId) return;
    setSubmitting(true);
    try {
      await api.post('/assignments', { course_id: courseId, title, description: description || null });
      toast.success('Assignment created');
      navigate('/teacher/assignments');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="font-serif text-2xl text-charcoal-800 tracking-wider uppercase mb-1">
        New Assignment
      </h1>
      <hr className="dotted-divider" />

      <div className="space-y-5 mt-6">
        <div>
          <label className="label-caps block mb-1.5">Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full px-4 py-3 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm focus:outline-none focus:border-charcoal-600 transition-colors"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-caps block mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title"
            className="w-full px-4 py-3 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 transition-colors"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          />
        </div>

        <div>
          <label className="label-caps block mb-1.5">
            Description / Instructions{' '}
            <span className="text-warmgray-400 normal-case tracking-normal font-sans text-xs">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what students should submit and what is expected..."
            className="w-full px-4 py-3 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 transition-colors resize-none"
            rows={5}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => navigate('/teacher/assignments')}
            className="px-5 py-2.5 text-[0.65rem] uppercase tracking-widest text-warmgray-400 hover:text-charcoal-600 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !courseId}
            className="px-5 py-2.5 bg-charcoal-800 text-cream-50 text-[0.65rem] uppercase tracking-widest hover:bg-charcoal-700 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '...' : 'Create Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}
