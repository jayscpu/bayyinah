import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import type { Assignment } from '../../types';

export default function AssignmentSubmit() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/assignments/${assignmentId}`)
      .then((res) => setAssignment(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const handleSubmit = async () => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/student/assignment-submissions/${res.data.id}/dialogue`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex justify-center mb-8">
        <img src="/assets/diamond.png" alt="" className="h-8 w-auto" />
      </div>

      <h1 className="font-serif text-2xl text-charcoal-800 tracking-wider uppercase text-center mb-1">
        {assignment?.title || 'Assignment'}
      </h1>

      {assignment?.description && (
        <p className="text-sm text-charcoal-600 leading-relaxed mt-3 text-center font-display italic">
          {assignment.description}
        </p>
      )}

      <hr className="dotted-divider" />

      <p className="label-caps mb-2">Upload Your Submission</p>
      <p className="text-xs text-warmgray-400 mb-5">Accepted formats: PDF, TXT, DOCX</p>

      {/* Drop zone */}
      <div
        className="border border-dashed border-warmgray-300 p-10 text-center cursor-pointer hover:border-warmgray-400 transition-colors bg-cream-50"
        onClick={() => fileInputRef.current?.click()}
      >
        {file ? (
          <>
            <p className="text-sm text-charcoal-800 font-serif">{file.name}</p>
            <p className="text-xs text-warmgray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
          </>
        ) : (
          <p className="text-warmgray-400 font-display italic">Click to choose a file</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <div className="flex justify-end mt-5">
        <button
          onClick={handleSubmit}
          disabled={!file || uploading}
          className="px-6 py-3 bg-charcoal-800 text-cream-50 text-xs uppercase tracking-widest hover:bg-charcoal-700 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Submit & Begin Dialogue'}
        </button>
      </div>

      <p className="text-[0.6rem] text-warmgray-400 mt-3 text-center">
        Your submission will be reviewed through a Socratic dialogue before it is marked complete.
      </p>
    </div>
  );
}
