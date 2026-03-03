import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import type { Course, Material } from '../../types';

export default function CourseManage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Record<string, Material[]>>({});
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);

      const matsMap: Record<string, Material[]> = {};
      for (const course of res.data) {
        const matRes = await api.get(`/courses/${course.id}/materials`);
        matsMap[course.id] = matRes.data;
      }
      setMaterials(matsMap);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await api.post('/courses', { title: newTitle, description: newDesc || null });
      setNewTitle('');
      setNewDesc('');
      await loadCourses();
      toast.success('Course created');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async (courseId: string, files: File[]) => {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await api.post(`/courses/${courseId}/materials`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(`Uploaded: ${file.name}`);
      } catch (err: any) {
        toast.error(`Failed: ${file.name} — ${err.response?.data?.detail || 'Error'}`);
      }
    }
    await loadCourses();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-2">Courses</p>
        <h1 className="heading-display text-4xl text-charcoal-800">Course Management</h1>
      </div>

      {/* Create course */}
      <Card>
        <h2 className="font-serif text-lg text-charcoal-800 mb-4">Create New Course</h2>
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <Input
            label="Course Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Information Security"
            required
          />
          <Input
            label="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Brief course description"
          />
          <Button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create Course'}
          </Button>
        </form>
      </Card>

      {/* Course list */}
      {courses.map((course) => (
        <Card key={course.id} decorative>
          <div className="flex justify-between items-start mb-5">
            <div>
              <Link to={`/teacher/courses/${course.id}`} className="hover:text-sage-600 transition-colors">
                <h2 className="font-serif text-xl text-charcoal-800">{course.title}</h2>
              </Link>
              {course.description && <p className="text-warmgray-400 text-sm mt-1">{course.description}</p>}
              <p className="text-xs text-warmgray-400 mt-1">
                <code className="bg-cream-200 px-1.5 py-0.5 rounded text-xs">{course.id}</code>
                {course.student_count !== undefined && (
                  <span className="ml-2">{course.student_count} students enrolled</span>
                )}
              </p>
            </div>
            <Link to={`/teacher/exams/create?courseId=${course.id}`}>
              <Button size="sm">Create Exam</Button>
            </Link>
          </div>

          {/* Material upload */}
          <DropZone courseId={course.id} onUpload={handleUpload} />

          {/* Material list */}
          {(materials[course.id] || []).length > 0 && (
            <div className="mt-4 space-y-2">
              {(materials[course.id] || []).map((mat) => (
                <div key={mat.id} className="flex items-center justify-between p-3 paper-warm rounded-sm border border-warmgray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-charcoal-700">{mat.original_name}</span>
                    <Badge variant={
                      mat.processing_status === 'completed' ? 'success' :
                      mat.processing_status === 'processing' ? 'warning' :
                      mat.processing_status === 'failed' ? 'error' : 'default'
                    }>
                      {mat.processing_status}
                    </Badge>
                    {mat.chunk_count > 0 && (
                      <span className="text-xs text-warmgray-400">{mat.chunk_count} chunks</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function DropZone({ courseId, onUpload }: { courseId: string; onUpload: (id: string, files: File[]) => void }) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(courseId, acceptedFiles);
  }, [courseId, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`border border-dashed rounded-sm p-6 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-sage-500 bg-sage-500/5' : 'border-warmgray-300 hover:border-sage-400'}`}
    >
      <input {...getInputProps()} />
      <p className="text-warmgray-500 text-sm">
        {isDragActive ? 'Drop files here...' : 'Drag & drop PDF or PPTX files, or click to select'}
      </p>
      <p className="text-xs text-warmgray-400 mt-1">Supports PDF and PPTX files up to 50MB</p>
    </div>
  );
}
