import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../config/api';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import type { Course } from '../../types';

export default function ExamCreate() {
  useLanguageStore();
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
    <div className="max-w-2xl animate-fade-in">
      <h1 className="font-serif text-3xl text-charcoal-800 tracking-wider uppercase mb-1">
        {t('examCreate.title')}
      </h1>
      <p className="text-xs text-warmgray-400 mb-4">{t('examCreate.subtitle')}</p>

      <hr className="dotted-divider" />

      <form onSubmit={handleCreate} className="space-y-5">
        <div>
          <p className="label-caps mb-2">{t('examCreate.course')}</p>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm focus:outline-none focus:border-charcoal-600"
          >
            <option value="">{t('examCreate.selectCourse')}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <p className="label-caps mb-2">{t('examCreate.examTitle')}</p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('examCreate.titlePlaceholder')}
            required
            className="w-full px-4 py-2.5 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600"
          />
        </div>

        <div>
          <p className="label-caps mb-2">{t('examCreate.descOptional')}</p>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('examCreate.descPlaceholder')}
            className="w-full px-4 py-2.5 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600"
          />
        </div>

        {courses.length === 0 && (
          <p className="text-sm text-warmgray-400 font-display italic">
            {t('examCreate.noCourses')}
          </p>
        )}

        <button
          type="submit"
          disabled={creating || !selectedCourse}
          className="w-full px-6 py-3 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors disabled:opacity-50"
        >
          {creating ? <Spinner size="sm" /> : t('examCreate.submit')}
        </button>
      </form>
    </div>
  );
}
