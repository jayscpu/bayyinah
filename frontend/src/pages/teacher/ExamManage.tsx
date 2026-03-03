import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
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
    return <div className="text-center py-20 text-warmgray-500 font-display italic text-lg">Exam not found</div>;
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <p className="label-caps mb-2">Exam Management</p>
        <h1 className="heading-display text-4xl text-charcoal-800">{exam.title}</h1>
        {exam.description && <p className="text-warmgray-400 text-sm mt-2">{exam.description}</p>}
        <div className="flex items-center gap-3 mt-3">
          <Badge variant={
            exam.status === 'published' ? 'success' :
            exam.status === 'draft' ? 'warning' : 'default'
          }>
            {exam.status}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {exam.status === 'draft' && (
            <Button onClick={handlePublish}>Publish Exam</Button>
          )}
          {exam.status === 'published' && (
            <Button variant="secondary" onClick={handleClose}>Close Exam</Button>
          )}
          {exam.status === 'draft' && (
            <Button variant="secondary" onClick={handleRegenerate} disabled={regenerating}>
              {regenerating ? 'Generating...' : 'AI Generate Questions'}
            </Button>
          )}
          {exam.status === 'draft' && (
            <Button variant="secondary" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? 'Cancel' : 'Write Question'}
            </Button>
          )}
          <Button variant="danger" onClick={handleDelete}>Delete Exam</Button>
        </div>
      </Card>

      {/* Add Question Form */}
      {showAddForm && (
        <Card decorative>
          <h3 className="font-serif text-lg text-charcoal-800 mb-5">Add Question</h3>
          <div className="space-y-4">
            <div>
              <label className="label-caps mb-2 block">Question Type</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNewType('essay')}
                  className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer ${
                    newType === 'essay'
                      ? 'bg-sage-500 text-white'
                      : 'bg-cream-100 text-charcoal-600 border border-warmgray-200 hover:bg-cream-200'
                  }`}
                >
                  Essay
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('mcq')}
                  className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer ${
                    newType === 'mcq'
                      ? 'bg-sage-500 text-white'
                      : 'bg-cream-100 text-charcoal-600 border border-warmgray-200 hover:bg-cream-200'
                  }`}
                >
                  Multiple Choice
                </button>
              </div>
            </div>

            <TextArea
              label="Question Text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Enter your question..."
              rows={3}
            />

            {newType === 'mcq' && (
              <div className="space-y-2">
                <label className="label-caps block">Options</label>
                {newOptions.map((opt, i) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <span className="font-serif text-sage-500 w-6">{opt.key}.</span>
                    <Input
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...newOptions];
                        updated[i] = { ...updated[i], text: e.target.value };
                        setNewOptions(updated);
                      }}
                      placeholder={`Option ${opt.key}`}
                    />
                  </div>
                ))}
              </div>
            )}

            <Button onClick={handleAddQuestion} disabled={addingQuestion}>
              {addingQuestion ? 'Adding...' : 'Add Question'}
            </Button>
          </div>
        </Card>
      )}

      {/* Questions */}
      {regenerating ? (
        <Card className="text-center py-12">
          <Spinner />
          <p className="text-warmgray-400 mt-4 font-display italic">Generating questions from course materials...</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="ornament-divider">
            <div className="ornament-diamond" />
          </div>

          <h2 className="font-serif text-xl text-charcoal-800">Questions ({questions.length})</h2>

          {questions.length === 0 ? (
            <Card className="text-center py-10">
              <p className="text-warmgray-400 font-display italic text-lg">No questions yet.</p>
              <p className="text-warmgray-400 text-xs mt-2">
                Use "AI Generate Questions" from course materials or "Write Question" to add manually.
              </p>
            </Card>
          ) : (
            questions.map((q) => (
              <Card key={q.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-display text-sage-500 text-lg">Q{q.display_order}</span>
                      <Badge variant={q.question_type === 'essay' ? 'info' : 'warning'}>
                        {q.question_type.toUpperCase()}
                      </Badge>
                    </div>

                    {editingId === q.id ? (
                      <div className="space-y-2">
                        <TextArea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(q.id)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-charcoal-800 text-sm leading-relaxed">{q.question_text}</p>
                    )}

                    {q.mcq_options && editingId !== q.id && (
                      <div className="mt-3 space-y-1">
                        {q.mcq_options.map((opt) => (
                          <p key={opt.key} className="text-sm text-charcoal-600">
                            <span className="font-serif text-sage-500">{opt.key}.</span> {opt.text}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {editingId !== q.id && exam.status === 'draft' && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(q)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => deleteQuestion(q.id)}>Delete</Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
