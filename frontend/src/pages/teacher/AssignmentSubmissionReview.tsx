import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import type { AssignmentSubmission, AssignmentDialogueMessage, AssignmentReview } from '../../types';

export default function AssignmentSubmissionReview() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [dialogue, setDialogue] = useState<AssignmentDialogueMessage[]>([]);
  const [existingReview, setExistingReview] = useState<AssignmentReview | null>(null);
  const [finalGrade, setFinalGrade] = useState(70);
  const [feedback, setFeedback] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [submissionId]);

  const loadData = async () => {
    try {
      const [subRes, dlgRes] = await Promise.all([
        api.get(`/assignment-submissions/${submissionId}/evaluation`),
        api.get(`/assignment-submissions/${submissionId}/dialogue`),
      ]);
      setSubmission(subRes.data);
      setDialogue(dlgRes.data);

      try {
        const reviewRes = await api.get(`/assignment-submissions/${submissionId}/review`);
        if (reviewRes.data) {
          setExistingReview(reviewRes.data);
          setFinalGrade(reviewRes.data.final_grade ?? 70);
          setFeedback(reviewRes.data.feedback || '');
          setInternalNotes(reviewRes.data.internal_notes || '');
        }
      } catch {
        // No review yet
      }
    } catch (err) {
      console.error('Failed to load', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (action: 'approved' | 'overridden') => {
    setSubmitting(true);
    try {
      const method = existingReview ? 'put' : 'post';
      await api[method](`/assignment-submissions/${submissionId}/review`, {
        final_grade: finalGrade,
        feedback: feedback || null,
        internal_notes: internalNotes || null,
        action_taken: action,
      });
      toast.success('Review submitted');
      navigate(-1);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!submission) return <p className="text-warmgray-400 text-center py-20">Submission not found</p>;

  const reasoning = submission.ai_score_reasoning;

  return (
    <div className="max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="font-serif text-2xl text-charcoal-800 tracking-wider uppercase">
            {submission.assignment_title || 'Assignment'}
          </h1>
          <p className="text-xs text-warmgray-400 mt-1">
            {submission.original_filename || 'Submitted file'} &middot; Status: {submission.status}
          </p>
        </div>
        {submission.ai_score !== null && submission.ai_score !== undefined && (
          <div className="text-right">
            <p className="font-display text-4xl text-charcoal-800 leading-none">
              {submission.ai_score.toFixed(0)}
            </p>
            <p className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider mt-1">AI Score / 100</p>
          </div>
        )}
      </div>

      <hr className="dotted-divider" />

      {/* AI Score Breakdown */}
      {reasoning && (
        <div className="dashboard-cards mb-6">
          {(['comprehension', 'critical_thinking', 'application'] as const).map((key) => {
            const item = reasoning[key];
            if (!item) return null;
            return (
              <div key={key} className="dashboard-card">
                <span className="dashboard-card-value">{item.score ?? '—'}</span>
                <span className="dashboard-card-label">{key.replace('_', ' ')}</span>
                {item.reasoning && (
                  <p className="text-[0.6rem] text-warmgray-400 mt-1 text-center leading-relaxed">
                    {item.reasoning}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
      {reasoning?.summary && (
        <p className="text-sm text-charcoal-600 font-display italic leading-relaxed mb-6">
          "{reasoning.summary}"
        </p>
      )}

      {/* Dialogue */}
      <p className="label-caps mb-3">Dialogue Transcript</p>
      <div className="mb-6 space-y-3">
        {dialogue.length === 0 ? (
          <p className="text-warmgray-400 font-display italic text-sm">No dialogue yet</p>
        ) : (
          dialogue.map((msg) => (
            <div
              key={msg.id}
              className={`px-4 py-3 border border-warmgray-200 text-sm text-charcoal-800 whitespace-pre-wrap leading-[1.8] ${
                msg.role === 'agent' ? 'dialogue-bubble-agent' : 'dialogue-bubble-student bg-cream-50 ml-auto max-w-[80%]'
              }`}
              style={msg.role === 'agent' ? { background: 'rgba(180,168,154,0.18)', maxWidth: '80%' } : {}}
            >
              <p className="text-[0.55rem] text-warmgray-400 uppercase tracking-widest mb-1">
                {msg.role === 'agent' ? 'Examiner' : 'Student'} · Turn {msg.turn_number}
              </p>
              {msg.content}
            </div>
          ))
        )}
      </div>

      {/* Grading Panel */}
      <div className="border-t border-warmgray-200 pt-6">
        <p className="label-caps mb-4">Your Assessment</p>
        <div className="space-y-4">
          <div>
            <label className="label-caps block mb-1.5">Final Grade (0–100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={finalGrade}
              onChange={(e) => setFinalGrade(Number(e.target.value))}
              className="w-32 px-4 py-2 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm focus:outline-none focus:border-charcoal-600 transition-colors"
            />
          </div>
          <div>
            <label className="label-caps block mb-1.5">Feedback to Student <span className="text-warmgray-400 normal-case tracking-normal font-sans text-xs">(optional)</span></label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 transition-colors resize-none"
              placeholder="Visible to the student..."
            />
          </div>
          <div>
            <label className="label-caps block mb-1.5">Internal Notes <span className="text-warmgray-400 normal-case tracking-normal font-sans text-xs">(optional, not shown to student)</span></label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 transition-colors resize-none"
              placeholder="Private notes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => handleSubmitReview('approved')}
              disabled={submitting}
              className="px-5 py-2.5 bg-cream-200 border border-warmgray-300 text-[0.65rem] uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 hover:border-charcoal-600 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Approve AI Score
            </button>
            <button
              onClick={() => handleSubmitReview('overridden')}
              disabled={submitting}
              className="px-5 py-2.5 bg-charcoal-800 text-cream-50 text-[0.65rem] uppercase tracking-widest hover:bg-charcoal-700 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Override with {finalGrade}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
