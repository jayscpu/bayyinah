import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../../config/api';
import { useLanguageStore, t } from '../../stores/languageStore';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import type { Course, Material } from '../../types';

export default function CourseManage() {
  useLanguageStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Record<string, Material[]>>({});
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
      if (res.data.length > 0) setSelectedId((prev) => prev ?? res.data[0].id);

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
      const res = await api.post('/courses', { title: newTitle, description: newDesc || null });
      setNewTitle('');
      setNewDesc('');
      setShowModal(false);
      await loadCourses();
      setSelectedId(res.data.id);
      toast.success('Course created');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMaterial = async (courseId: string, materialId: string) => {
    if (!confirm(t('courseManage.deleteMaterial'))) return;
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

  const selected = courses.find((c) => c.id === selectedId) ?? null;
  const selectedMaterials = selected ? (materials[selected.id] || []) : [];

  return (
    <div
      className="animate-fade-in"
      style={{
        marginInlineStart: 'min(calc(570px - 50vw), 8px)',
        width: 'calc(100vw - 240px)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 className="font-display text-[2.75rem] text-charcoal-800 leading-tight">
          {t('courses.title')}
        </h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '6px 18px',
            background: 'transparent',
            border: '1px solid #C4BCB0',
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#4A4A4A',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2A2A2A'; (e.currentTarget as HTMLButtonElement).style.color = '#2A2A2A'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#C4BCB0'; (e.currentTarget as HTMLButtonElement).style.color = '#4A4A4A'; }}
        >
          {t('courseManage.createCourse')}
        </button>
      </div>

      {/* Full-width divider */}
      <div style={{ borderTop: '1px solid #2A2A2A', marginBottom: '0' }} />

      {courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p className="text-warmgray-400 font-display italic text-xl">{t('courseManage.noCourses')}</p>
          <p style={{ fontSize: '0.75rem', color: '#A89E92', marginTop: '8px' }}>{t('courseManage.createFirst')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex' }}>

          {/* Left panel — course list */}
          <div style={{ width: '35%', borderInlineEnd: '1px solid #D4CCC0', paddingTop: '28px', flexShrink: 0 }}>
            <p style={{ padding: '0 24px 12px', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#A89E92' }}>
              {courses.length} {courses.length !== 1 ? t('courses.courses') : t('courses.course')}
            </p>

            <div>
              {courses.map((course) => {
                const isSelected = course.id === selectedId;
                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedId(course.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'start',
                      padding: '14px 24px',
                      background: isSelected ? '#E8DECE' : 'transparent',
                      border: 'none',
                      borderInlineStart: isSelected ? '3px solid #2A2A2A' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#E8DECE'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem', color: '#2A2A2A', marginBottom: '3px' }}>
                      {course.title}
                    </p>
                    <p style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {(materials[course.id] || []).length} {(materials[course.id] || []).length !== 1 ? t('courseManage.materialPlural') : t('courseManage.material')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel — selected course detail */}
          <div style={{ flex: 1, paddingTop: '28px', paddingInlineStart: '48px', paddingInlineEnd: '0' }}>
            {selected && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h2 className="font-serif" style={{ fontSize: '1.5rem', color: '#2A2A2A', letterSpacing: '0.02em' }}>
                    {selected.title}
                  </h2>
                  <Link
                    to={`/teacher/courses/${selected.id}`}
                    style={{ fontSize: '0.65rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em', textDecoration: 'none', marginTop: '6px', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#2A2A2A')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#A89E92')}
                  >
                    {t('courseManage.details')}
                  </Link>
                </div>

                {selected.description && (
                  <p style={{ fontSize: '0.875rem', color: '#A89E92', lineHeight: 1.7, marginBottom: '12px' }}>
                    {selected.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                  <p style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    ID: <span style={{ fontFamily: 'monospace' }}>{selected.id.substring(0, 8)}</span>
                  </p>
                  {selected.student_count !== undefined && (
                    <p style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                      {selected.student_count} {selected.student_count !== 1 ? t('courseManage.students') : t('courseManage.student')}
                    </p>
                  )}
                </div>

                {/* Materials */}
                <div style={{ borderTop: '1px dotted #C4BCB0', paddingTop: '24px' }}>
                  <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#A89E92', marginBottom: '16px' }}>
                    {t('courseManage.materials')}
                  </p>

                  <DropZone courseId={selected.id} onUploadComplete={loadCourses} />

                  {selectedMaterials.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedMaterials.map((mat) => (
                        <div
                          key={mat.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 16px',
                            background: '#E8DECE',
                            border: '1px solid #D4CCC0',
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', color: '#3D3D3D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginInlineEnd: '16px' }}>
                            {mat.original_name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                            <span style={{
                              fontSize: '0.6rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                              color: mat.processing_status === 'completed' ? '#5B6B4A' : mat.processing_status === 'failed' ? '#f87171' : '#A89E92',
                            }}>
                              {mat.processing_status}
                              {mat.chunk_count > 0 && ` · ${mat.chunk_count} ${t('courseManage.chunks')}`}
                            </span>
                            <button
                              onClick={() => handleDeleteMaterial(selected.id, mat.id)}
                              style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                              onMouseLeave={e => (e.currentTarget.style.color = '#A89E92')}
                            >
                              {t('courseManage.delete')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setNewTitle(''); setNewDesc(''); }}
        title={t('courseManage.createTitle')}
      >
        <div className="space-y-4 mt-2">
          <div>
            <label className="label-caps block mb-1.5">{t('courseManage.courseTitle')}</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t('courseManage.titlePlaceholder')}
              className="w-full px-6 py-4 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 transition-colors"
              style={{ background: '#E8DECE' }}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCourse(); }}
            />
          </div>
          <div>
            <label className="label-caps block mb-1.5">
              {t('courseManage.description')}{' '}
              <span className="text-warmgray-400 normal-case tracking-normal font-sans">{t('courseManage.optional')}</span>
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder={t('courseManage.descPlaceholder')}
              className="w-full px-6 py-4 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 transition-colors resize-none"
              style={{ background: '#E8DECE' }}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setShowModal(false); setNewTitle(''); setNewDesc(''); }}
              className="px-5 py-2.5 text-[0.65rem] uppercase tracking-widest text-warmgray-400 hover:text-charcoal-600 cursor-pointer transition-colors"
            >
              {t('courseManage.cancel')}
            </button>
            <button
              onClick={handleCreateCourse}
              disabled={creating || !newTitle.trim()}
              className="px-8 py-4 border uppercase cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#D5CCBE', borderColor: '#C4BCB0', color: '#4A4A4A', fontSize: '0.85rem', letterSpacing: '0' }}
            >
              {creating ? t('courseManage.creating') : t('courseManage.create')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; fileName: string; progress: number }
  | { status: 'error'; fileName: string; message: string };

function DropZone({ courseId, onUploadComplete }: { courseId: string; onUploadComplete: () => void }) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      setUploadState({ status: 'uploading', fileName: file.name, progress: 0 });
      const formData = new FormData();
      formData.append('file', file);
      try {
        await api.post(`/courses/${courseId}/materials`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            setUploadState({ status: 'uploading', fileName: file.name, progress: pct });
          },
        });
        setUploadState({ status: 'idle' });
        onUploadComplete();
      } catch (err: any) {
        const msg = err.response?.data?.detail || 'Upload failed';
        setUploadState({ status: 'error', fileName: file.name, message: msg });
        setTimeout(() => setUploadState({ status: 'idle' }), 4000);
      }
    }
  }, [courseId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    disabled: uploadState.status === 'uploading',
  });

  if (uploadState.status === 'uploading') {
    return (
      <div style={{ border: '1px dashed #D4CCC0', padding: '16px' }}>
        <p style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {uploadState.fileName}
        </p>
        <div style={{ width: '100%', background: '#DDD6C8', height: '3px' }}>
          <div style={{ height: '100%', background: '#8C8278', transition: 'width 0.2s', width: `${uploadState.progress}%` }} />
        </div>
        <p style={{ fontSize: '0.6rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '8px' }}>
          {t('courseManage.uploading')} {uploadState.progress}%
        </p>
      </div>
    );
  }

  if (uploadState.status === 'error') {
    return (
      <div style={{ border: '1px dashed #fca5a5', padding: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.6rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{uploadState.message}</p>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      style={{
        border: `1px dashed ${isDragActive ? '#3D3D3D' : '#D4CCC0'}`,
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        background: isDragActive ? '#DDD6C8' : 'transparent',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <input {...getInputProps()} />
      <p style={{ fontSize: '0.7rem', color: '#A89E92', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {isDragActive ? t('courseManage.dropFiles') : t('courseManage.dropUpload')}
      </p>
    </div>
  );
}
