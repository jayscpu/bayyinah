import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import type { Exam, ExamQuestion } from '../../types';

export default function ExamManage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  // Add question form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState<'essay' | 'mcq'>('essay');
  const [newText, setNewText] = useState('');
  const [newOptions, setNewOptions] = useState([
    { key: 'A', text: '' },
    { key: 'B', text: '' },
    { key: 'C', text: '' },
    { key: 'D', text: '' },
  ]);
  const [addingQuestion, setAddingQuestion] = useState(false);

  useEffect(() => {
    loadData();
  }, [examId]);

  const loadData = async () => {
    try {
      const [examRes, questionsRes] = await Promise.all([
        api.get(`/exams/${examId}`),
        api.get(`/exams/${examId}/questions`),
      ]);
      setExam(examRes.data);
      setQuestions(questionsRes.data);
    } catch (err) {
      console.error('Failed to load exam', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      await api.post(`/exams/${examId}/publish`);
      toast.success('Exam published!');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to publish');
    }
  };

  const handleClose = async () => {
    try {
      await api.post(`/exams/${examId}/close`);
      toast.success('Exam closed');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to close');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this exam? This cannot be undone.')) return;
    try {
      await api.delete(`/exams/${examId}`);
      toast.success('Exam deleted');
      navigate('/teacher/exams');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const handleRegenerate = async () => {
    if (questions.length > 0 && !confirm('This will replace all existing questions. Continue?')) return;
    setRegenerating(true);
    try {
      await api.post(`/exams/${examId}/regenerate-questions`);
      toast.success('Generating questions from course materials...');
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const res = await api.get(`/exams/${examId}/questions`);
        if (res.data.length > 0) {
          setQuestions(res.data);
          setRegenerating(false);
          toast.success('Questions generated!');
          return;
        }
      }
      setRegenerating(false);
      toast.error('Generation is still in progress. Refresh to check.');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to regenerate');
      setRegenerating(false);
    }
  };

  const startEdit = (q: ExamQuestion) => {
    setEditingId(q.id);
    setEditText(q.question_text);
  };

  const saveEdit = async (questionId: string) => {
    try {
      await api.put(`/exams/${examId}/questions/${questionId}`, {
        question_text: editText,
      });
      toast.success('Question updated');
      setEditingId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update');
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/exams/${examId}/questions/${questionId}`);
      toast.success('Question deleted');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const handleAddQuestion = async () => {
    if (!newText.trim()) {
      toast.error('Question text is required');
      return;
    }
    if (newType === 'mcq' && newOptions.some((o) => !o.text.trim())) {
      toast.error('All MCQ options must be filled');
      return;
    }
    setAddingQuestion(true);
    try {
      await api.post(`/exams/${examId}/questions`, {
        question_type: newType,
        question_text: newText,
        mcq_options: newType === 'mcq' ? newOptions : null,
        display_order: questions.length + 1,
      });
      toast.success('Question added');
      setNewText('');
      setNewType('essay');
      setNewOptions([
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ]);
      setShowAddForm(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add question');
    } finally {
      setAddingQuestion(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!exam) {
    return <div className="text-center py-20 text-warmgray-400 font-display italic">Exam not found</div>;
  }

  return (
    <div className="max-w-3xl animate-fade-in">
      {/* Header */}
      <h1 className="font-serif text-2xl text-charcoal-800 tracking-wider uppercase mb-1">
        {exam.title}
      </h1>
      {exam.description && <p className="text-xs text-warmgray-400 mb-1">{exam.description}</p>}
      <p className="text-xs text-warmgray-400 uppercase tracking-wider">{exam.status}</p>

      <hr className="dotted-divider" />

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        {exam.status === 'draft' && (
          <button
            onClick={handlePublish}
            className="px-4 py-2 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors"
          >
            Publish Exam
          </button>
        )}
        {exam.status === 'published' && (
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors"
          >
            Close Exam
          </button>
        )}
        {exam.status === 'draft' && (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-4 py-2 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors disabled:opacity-50"
          >
            {regenerating ? 'Generating...' : 'AI Generate Questions'}
          </button>
        )}
        {exam.status === 'draft' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors"
          >
            {showAddForm ? 'Cancel' : 'Write Question'}
          </button>
        )}
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-warmgray-400 hover:text-red-400 cursor-pointer transition-colors"
        >
          Delete Exam
        </button>
      </div>

      {/* Add Question Form */}
      {showAddForm && (
        <div className="bg-cream-200 border border-warmgray-200 p-6 mb-6">
          <p className="font-serif text-lg text-charcoal-800 mb-4">Add Question</p>

          <div className="mb-4">
            <p className="label-caps mb-2">Type</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setNewType('essay')}
                className={`px-4 py-2 text-xs uppercase tracking-wider cursor-pointer transition-colors ${
                  newType === 'essay'
                    ? 'bg-charcoal-800 text-cream-100'
                    : 'bg-cream-100 text-charcoal-600 border border-warmgray-200 hover:bg-cream-300'
                }`}
              >
                Essay
              </button>
              <button
                type="button"
                onClick={() => setNewType('mcq')}
                className={`px-4 py-2 text-xs uppercase tracking-wider cursor-pointer transition-colors ${
                  newType === 'mcq'
                    ? 'bg-charcoal-800 text-cream-100'
                    : 'bg-cream-100 text-charcoal-600 border border-warmgray-200 hover:bg-cream-300'
                }`}
              >
                Multiple Choice
              </button>
            </div>
          </div>

          <div className="mb-4">
            <p className="label-caps mb-2">Question Text</p>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Enter your question..."
              rows={3}
              className="w-full px-4 py-3 bg-cream-50 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600 resize-y"
            />
          </div>

          {newType === 'mcq' && (
            <div className="mb-4 space-y-2">
              <p className="label-caps">Options</p>
              {newOptions.map((opt, i) => (
                <div key={opt.key} className="flex items-center gap-2">
                  <span className="font-serif text-charcoal-600 w-6">{opt.key}.</span>
                  <input
                    value={opt.text}
                    onChange={(e) => {
                      const updated = [...newOptions];
                      updated[i] = { ...updated[i], text: e.target.value };
                      setNewOptions(updated);
                    }}
                    placeholder={`Option ${opt.key}`}
                    className="flex-1 px-3 py-2 bg-cream-50 border border-warmgray-200 text-charcoal-800 text-sm placeholder-warmgray-400 focus:outline-none focus:border-charcoal-600"
                  />
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAddQuestion}
            disabled={addingQuestion}
            className="px-6 py-2 bg-cream-50 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors disabled:opacity-50"
          >
            {addingQuestion ? 'Adding...' : 'Add Question'}
          </button>
        </div>
      )}

      {/* Questions */}
      {regenerating ? (
        <div className="text-center py-12">
          <Spinner />
          <p className="text-warmgray-400 mt-4 font-display italic">Generating questions from course materials...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="label-caps">Questions ({questions.length})</p>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-warmgray-400 font-display italic text-lg">No questions yet.</p>
              <p className="text-warmgray-400 text-xs mt-2">
                Use "AI Generate Questions" or "Write Question" above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="bg-cream-200 border border-warmgray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-display text-charcoal-800 text-lg">Q{q.display_order}</span>
                        <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">
                          {q.question_type}
                        </span>
                      </div>

                      {editingId === q.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-cream-50 border border-warmgray-200 text-charcoal-800 text-sm focus:outline-none focus:border-charcoal-600 resize-y"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(q.id)}
                              className="px-3 py-1 bg-cream-50 border border-warmgray-200 text-[0.65rem] uppercase tracking-wider text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 text-[0.65rem] uppercase tracking-wider text-warmgray-400 hover:text-charcoal-800 cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-charcoal-800 text-sm leading-relaxed">{q.question_text}</p>
                      )}

                      {q.mcq_options && editingId !== q.id && (
                        <div className="mt-3 space-y-1">
                          {q.mcq_options.map((opt) => (
                            <p key={opt.key} className="text-sm text-charcoal-600">
                              <span className="font-serif text-charcoal-800">{opt.key}.</span> {opt.text}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {editingId !== q.id && exam.status === 'draft' && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => startEdit(q)}
                          className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 cursor-pointer transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-red-400 cursor-pointer transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
