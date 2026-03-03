import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import TextArea from '../../components/ui/TextArea';
import type { Exam, ExamQuestion, ExamSession as Session, StudentAnswer } from '../../types';

export default function ExamSession() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<ExamQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [mcqSelections, setMcqSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initExam();
  }, [examId]);

  const initExam = async () => {
    try {
      const [examRes, questionsRes] = await Promise.all([
        api.get(`/exams/${examId}`),
        api.get(`/exams/${examId}/questions`),
      ]);
      setExam(examRes.data);
      setQuestions(questionsRes.data);

      // Start or resume session
      const sessionRes = await api.post(`/exams/${examId}/sessions`);
      setSession(sessionRes.data);

      // Load existing answers
      const answersRes = await api.get(`/sessions/${sessionRes.data.id}/answers`);
      setAnswers(answersRes.data);
    } catch (err) {
      console.error('Failed to initialize exam', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session || !activeQuestion) return;
    setSubmitting(true);
    try {
      const payload: any = { question_id: activeQuestion.id };
      if (activeQuestion.question_type === 'essay') {
        payload.answer_text = answerText;
      } else {
        payload.mcq_selections = Object.entries(mcqSelections)
          .filter(([, justification]) => justification.trim())
          .map(([key, justification]) => ({ key, justification }));
      }

      const res = await api.post(`/sessions/${session.id}/answers`, payload);
      setAnswers([...answers, res.data]);

      // Start Socratic dialogue
      navigate(`/student/dialogue/${res.data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const isQuestionAnswered = (qId: string) => answers.some((a) => a.question_id === qId);
  const isQuestionDialogueComplete = (qId: string) => {
    const answer = answers.find((a) => a.question_id === qId);
    return answer && answer.dialogue_turns_completed >= 3;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!exam || !session) {
    return <div className="text-center py-20 text-warmgray-500 font-display italic text-lg">Exam not found</div>;
  }

  // If session is completed, redirect to results
  if (session.status !== 'in_progress') {
    return (
      <Card className="text-center py-12 max-w-lg mx-auto" decorative>
        <h2 className="heading-display text-3xl text-charcoal-800 mb-4">Exam Completed</h2>
        <p className="text-warmgray-400 text-sm mb-6">Your exam has been submitted for review.</p>
        <Button onClick={() => navigate('/student/results')}>View Results</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-2">Exam in Progress</p>
        <h1 className="heading-display text-3xl text-charcoal-800">{exam.title}</h1>
        <p className="text-warmgray-400 text-sm mt-2">
          {answers.filter((a) => a.dialogue_turns_completed >= 3).length} of {questions.length} questions completed
        </p>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {questions.map((q) => (
          <div
            key={q.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              isQuestionDialogueComplete(q.id) ? 'bg-sage-500' :
              isQuestionAnswered(q.id) ? 'bg-gold-400' : 'bg-warmgray-200'
            }`}
          />
        ))}
      </div>

      {/* Question overview */}
      {!activeQuestion ? (
        <div className="grid gap-4">
          {questions.map((q) => {
            const answered = isQuestionAnswered(q.id);
            const complete = isQuestionDialogueComplete(q.id);
            const answer = answers.find((a) => a.question_id === q.id);

            return (
              <Card key={q.id} className={`transition-all ${!complete ? 'cursor-pointer hover:border-sage-400' : ''}`}
                onClick={() => {
                  if (complete) return;
                  if (answered && answer && answer.dialogue_turns_completed < 3) {
                    navigate(`/student/dialogue/${answer.id}`);
                  } else if (!answered) {
                    setActiveQuestion(q);
                    setAnswerText('');
                    setMcqSelections({});
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-display text-lg text-sage-500">Question {q.display_order}</span>
                      <Badge variant={q.question_type === 'essay' ? 'info' : 'warning'}>
                        {q.question_type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-charcoal-700 text-sm leading-relaxed">{q.question_text}</p>
                  </div>
                  <div className="ml-4">
                    {complete ? (
                      <Badge variant="success">Complete</Badge>
                    ) : answered ? (
                      <Badge variant="warning">In Dialogue</Badge>
                    ) : (
                      <Badge>Not Started</Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Active question answering */
        <Card decorative>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-sage-500">Question {activeQuestion.display_order}</span>
              <Badge variant={activeQuestion.question_type === 'essay' ? 'info' : 'warning'}>
                {activeQuestion.question_type.toUpperCase()}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveQuestion(null)}>
              Back to Questions
            </Button>
          </div>

          <p className="text-charcoal-800 font-serif text-lg mb-6 leading-relaxed">{activeQuestion.question_text}</p>

          <div className="ornament-divider mb-6">
            <div className="ornament-diamond" />
          </div>

          {activeQuestion.question_type === 'essay' ? (
            <TextArea
              label="Your Answer"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Write your answer here..."
              rows={6}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-warmgray-400">Select one or more options and provide justification for each selection.</p>
              {activeQuestion.mcq_options?.map((opt) => (
                <div key={opt.key} className="border border-warmgray-200 rounded-sm p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!mcqSelections[opt.key]}
                      onChange={(e) => {
                        setMcqSelections((prev) => {
                          if (e.target.checked) return { ...prev, [opt.key]: '' };
                          const { [opt.key]: _, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className="mt-1 accent-sage-500"
                    />
                    <div className="flex-1">
                      <span className="font-serif text-charcoal-800">
                        <span className="text-sage-500">{opt.key}.</span> {opt.text}
                      </span>
                      {mcqSelections[opt.key] !== undefined && (
                        <textarea
                          className="w-full mt-2 px-3 py-2 bg-cream-50 border border-warmgray-200 rounded-sm text-sm text-charcoal-800 placeholder-warmgray-400 focus:outline-none focus:border-sage-500 resize-none"
                          placeholder="Justify your selection..."
                          value={mcqSelections[opt.key]}
                          onChange={(e) => setMcqSelections((prev) => ({ ...prev, [opt.key]: e.target.value }))}
                          rows={2}
                        />
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSubmitAnswer} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Answer & Begin Dialogue'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
