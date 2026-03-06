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

      <div style={{ background: '#E8DECE', border: '1px solid #D4CCC0', borderRadius: '8px', padding: '36px', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div>
          <label className="label-caps block mb-1.5">Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full px-4 text-charcoal-800 text-sm focus:outline-none transition-colors"
            style={{ border: '1px solid #D4CCC0', background: '#F5F0E8', padding: '14px 16px' }}
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
            className="w-full px-4 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none transition-colors"
            style={{ border: '1px solid #D4CCC0', background: '#F5F0E8', padding: '14px 16px' }}
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
            className="w-full px-4 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none transition-colors resize-none"
            style={{ border: '1px solid #D4CCC0', background: '#F5F0E8', padding: '14px 16px', minHeight: '150px' }}
            rows={5}
          />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={() => navigate('/teacher/assignments')}
            className="text-[0.65rem] uppercase tracking-widest text-warmgray-400 hover:text-charcoal-600 cursor-pointer transition-colors"
            style={{ background: 'none', border: 'none', padding: '8px 12px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !courseId}
            className="text-[0.65rem] uppercase tracking-widest text-charcoal-700 hover:text-charcoal-900 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderRadius: '10px', padding: '8px 16px', background: 'rgba(180,168,154,0.18)' }}
          >
            {submitting ? '...' : 'Create Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}
