import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import type { Course, Material } from '../../types';

export default function CourseManage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Record<string, Material[]>>({});
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
      setShowModal(false);
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
      {/* Page header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-serif text-3xl text-charcoal-800 tracking-wider uppercase">
            Courses
          </h1>
          <p className="text-xs text-warmgray-400 mt-1.5 uppercase tracking-wider">
            {courses.length} course{courses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-cream-200 border border-warmgray-300 text-[0.65rem] uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 hover:border-charcoal-600 cursor-pointer transition-all duration-200"
        >
          + Create Course
        </button>
      </div>

      <div className="border-t border-charcoal-800" />

      {/* Course list */}
      {courses.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display italic text-xl text-warmgray-400">No courses yet</p>
          <p className="text-xs text-warmgray-400 mt-3 uppercase tracking-wider">
            Create your first course to get started
          </p>
        </div>
      ) : (
        <div>
          {courses.map((course) => (
            <div key={course.id} className="border-b border-warmgray-200">
              <div className="py-7 flex items-start justify-between group">
                {/* Left: course info */}
                <div className="flex-1 min-w-0 pr-8">
                  <h2 className="font-serif text-lg text-charcoal-800 tracking-wide">
                    {course.title}
                  </h2>
                  {course.description && (
                    <p className="text-sm text-warmgray-400 mt-1.5 leading-relaxed">
                      {course.description}
                    </p>
                  )}
                  <div className="flex items-center gap-5 mt-3">
                    <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">
                      ID: <span className="font-mono">{course.id.substring(0, 8)}</span>
                    </span>
                    {course.student_count !== undefined && (
                      <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">
                        {course.student_count} student{course.student_count !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">
                      {(materials[course.id] || []).length} material{(materials[course.id] || []).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-6 shrink-0 pt-1">
                  <Link
                    to={`/teacher/courses/${course.id}`}
                    className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors"
                  >
                    Details
                  </Link>
                  <button
                    onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                    className={`text-[0.65rem] uppercase tracking-wider transition-colors cursor-pointer ${
                      expandedCourse === course.id
                        ? 'text-charcoal-800'
                        : 'text-warmgray-400 hover:text-charcoal-800'
                    }`}
                  >
                    Materials
                  </button>
                </div>
              </div>

              {/* Expanded: materials + upload */}
              {expandedCourse === course.id && (
                <div className="pb-7 animate-fade-in">
                  <DropZone courseId={course.id} onUpload={handleUpload} />
                  {(materials[course.id] || []).length > 0 && (
                    <div className="mt-4 space-y-1">
                      {(materials[course.id] || []).map((mat) => (
                        <div
                          key={mat.id}
                          className="flex items-center justify-between px-4 py-3 bg-cream-200 border border-warmgray-200"
                        >
                          <span className="text-xs text-charcoal-700 truncate mr-4">{mat.original_name}</span>
                          <div className="flex items-center gap-4 shrink-0">
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

      {/* Create Course Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setNewTitle(''); setNewDesc(''); }}
        title="Create a Course"
      >
        <div className="space-y-4 mt-2">
          <div>
            <label className="label-caps block mb-1.5">Course Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Introduction to Philosophy"
              className="w-full px-4 py-3 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 transition-colors"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCourse(); }}
            />
          </div>
          <div>
            <label className="label-caps block mb-1.5">Description <span className="text-warmgray-400 normal-case tracking-normal font-sans">(optional)</span></label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Brief description of the course..."
              className="w-full px-4 py-3 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 transition-colors resize-none"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setShowModal(false); setNewTitle(''); setNewDesc(''); }}
              className="px-5 py-2.5 text-[0.65rem] uppercase tracking-widest text-warmgray-400 hover:text-charcoal-600 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCourse}
              disabled={creating || !newTitle.trim()}
              className="px-5 py-2.5 bg-cream-200 border border-warmgray-300 text-[0.65rem] uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 hover:border-charcoal-600 cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
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
      className={`border border-dashed p-5 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-charcoal-600 bg-cream-300' : 'border-warmgray-300 hover:border-warmgray-400'
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-warmgray-400 text-xs uppercase tracking-wider">
        {isDragActive ? 'Drop files here...' : 'Drop PDF / PPTX or click to upload'}
      </p>
    </div>
  );
}
