export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher';
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Course {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  created_at: string;
  teacher_name?: string;
  student_count?: number;
}

export interface Material {
  id: string;
  course_id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size_bytes: number | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  chunk_count: number;
  created_at: string;
}

export interface Exam {
  id: string;
  course_id: string;
  created_by: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published' | 'closed';
  question_count: number;
  socratic_turns: number;
  weight_conceptual: number;
  weight_interconnection: number;
  weight_application: number;
  weight_reasoning: number;
  published_at: string | null;
  closes_at: string | null;
  created_at: string;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_type: 'essay' | 'mcq';
  question_text: string;
  mcq_options: { key: string; text: string }[] | null;
  display_order: number;
}

export interface ExamSession {
  id: string;
  exam_id: string;
  student_id: string;
  status: 'in_progress' | 'completed' | 'scored' | 'validated';
  started_at: string;
  completed_at: string | null;
  ai_score: number | null;
  ai_criterion_scores: Record<string, any> | null;
  current_question_index: number;
  question_order: string[] | null;
}

export interface StudentAnswer {
  id: string;
  session_id: string;
  question_id: string;
  answer_text: string | null;
  mcq_selections: { key: string; justification: string }[] | null;
  dialogue_turns_completed: number;
  ai_question_score: number | null;
  answered_at: string;
}

export interface AnswerWithQuestion {
  id: string;
  session_id: string;
  question_id: string;
  question_text: string;
  answer_text: string | null;
  mcq_selections: { key: string; justification: string }[] | null;
  dialogue_turns_completed: number;
}

export interface DialogueMessage {
  id: string;
  role: 'agent' | 'student';
  content: string;
  turn_number: number;
  created_at: string;
}

export interface TeacherGrade {
  id: string;
  session_id: string;
  graded_by: string;
  final_grade: number;
  feedback: string | null;
  action_taken: 'approved' | 'overridden' | 're_dialogue_requested';
  created_at: string;
}
