import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../../config/api';
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
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

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

  const handleCreateCourse = async () => {
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

  const handleDeleteMaterial = async (courseId: string, materialId: string) => {
    if (!confirm('Delete this material?')) return;
    try {
      await api.delete(`/courses/${courseId}/materials/${materialId}`);
      toast.success('Material deleted');
      await loadCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete material');
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

      <h1 className="font-serif text-3xl text-charcoal-800 tracking-wider uppercase text-center mb-2">
        Courses
      </h1>

      <hr className="dotted-divider" />

      {/* Create course bar */}
      <div className="mb-8">
        <p className="label-caps mb-3">Create a Course</p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Course Title"
            className="flex-1 px-4 py-2 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 px-4 py-2 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600"
          />
          <button
            onClick={handleCreateCourse}
            disabled={creating}
            className="px-4 py-2 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors disabled:opacity-50"
          >
            {creating ? '...' : 'Create'}
          </button>
        </div>
      </div>

      {/* Course grid — 3 columns, scrollable */}
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-warmgray-400 font-display italic text-lg">No courses yet</p>
          <p className="text-warmgray-400 text-xs mt-2">Create your first course above</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0 relative overflow-y-auto max-h-[60vh]">
          {courses.map((course) => (
            <div key={course.id} className="course-card px-4 py-5">
              <div className="flex items-center gap-2 mb-1">
                <img src="/assets/diamond.png" alt="" className="h-6 w-6 shrink-0" />
                <p className="course-card-title">{course.title}</p>
              </div>
              {course.description && (
                <p className="course-card-desc">{course.description}</p>
              )}
              <p className="text-[0.6rem] text-warmgray-400 mt-2">
                ID: <code className="text-warmgray-500">{course.id.substring(0, 8)}</code>
                {course.student_count !== undefined && (
                  <span> &middot; {course.student_count} students</span>
                )}
              </p>

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <Link
                  to={`/teacher/courses/${course.id}`}
                  className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors"
                >
                  Details
                </Link>
                <button
                  onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                  className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors cursor-pointer"
                >
                  Materials
                </button>
              </div>

              {/* Expanded: materials + upload */}
              {expandedCourse === course.id && (
                <div className="mt-4 text-left">
                  <DropZone courseId={course.id} onUpload={handleUpload} />
                  {(materials[course.id] || []).length > 0 && (
                    <div className="mt-3 space-y-1">
                      {(materials[course.id] || []).map((mat) => (
                        <div
                          key={mat.id}
                          className="flex items-center justify-between px-3 py-2 bg-cream-200 border border-warmgray-200"
                        >
                          <span className="text-xs text-charcoal-700">{mat.original_name}</span>
                          <div className="flex items-center gap-3">
                            <span className={`text-[0.6rem] uppercase tracking-wider ${
                              mat.processing_status === 'completed' ? 'text-sage-500' :
                              mat.processing_status === 'failed' ? 'text-red-400' :
                              'text-warmgray-400'
                            }`}>
                              {mat.processing_status}
                              {mat.chunk_count > 0 && ` · ${mat.chunk_count} chunks`}
                            </span>
                            <button
                              onClick={() => handleDeleteMaterial(course.id, mat.id)}
                              className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider hover:text-red-400 transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
      className={`border border-dashed p-4 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-charcoal-600 bg-cream-300' : 'border-warmgray-300 hover:border-warmgray-400'
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-warmgray-400 text-xs">
        {isDragActive ? 'Drop files here...' : 'Drop PDF/PPTX or click to upload'}
      </p>
    </div>
  );
}
