import { createBrowserRouter } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Landing from '../pages/Landing';
import FAQ from '../pages/FAQ';
import Login from '../pages/Login';
import Register from '../pages/Register';
import StudentDashboard from '../pages/student/Dashboard';
import ExamSession from '../pages/student/ExamSession';
import DialogueSession from '../pages/student/DialogueSession';
import StudentCourses from '../pages/student/Courses';
import StudentExams from '../pages/student/Exams';
import StudentAssignments from '../pages/student/Assignments';
import AssignmentSubmit from '../pages/student/AssignmentSubmit';
import AssignmentDialogue from '../pages/student/AssignmentDialogue';
import Results from '../pages/student/Results';
import TeacherDashboard from '../pages/teacher/Dashboard';
import CourseManage from '../pages/teacher/CourseManage';
import ExamCreate from '../pages/teacher/ExamCreate';
import CourseDetail from '../pages/teacher/CourseDetail';
import ExamList from '../pages/teacher/ExamList';
import ExamManage from '../pages/teacher/ExamManage';
import ExamReview from '../pages/teacher/ExamReview';
import StudentReview from '../pages/teacher/StudentReview';
import Reviews from '../pages/teacher/Reviews';
import AssignmentList from '../pages/teacher/AssignmentList';
import AssignmentCreate from '../pages/teacher/AssignmentCreate';
import AssignmentReview from '../pages/teacher/AssignmentReview';
import AssignmentSubmissionReview from '../pages/teacher/AssignmentSubmissionReview';

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/faq', element: <FAQ /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },

  // Student routes
  {
    element: (
      <ProtectedRoute requiredRole="student">
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/student', element: <StudentDashboard /> },
      { path: '/student/courses', element: <StudentCourses /> },
      { path: '/student/exams', element: <StudentExams /> },
      { path: '/student/exam/:examId', element: <ExamSession /> },
      { path: '/student/dialogue/:answerId', element: <DialogueSession /> },
      { path: '/student/assignments', element: <StudentAssignments /> },
      { path: '/student/assignments/:assignmentId/submit', element: <AssignmentSubmit /> },
      { path: '/student/assignment-submissions/:submissionId/dialogue', element: <AssignmentDialogue /> },
      { path: '/student/results', element: <Results /> },
    ],
  },

  // Teacher routes
  {
    element: (
      <ProtectedRoute requiredRole="teacher">
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/teacher', element: <TeacherDashboard /> },
      { path: '/teacher/courses', element: <CourseManage /> },
      { path: '/teacher/courses/:courseId', element: <CourseDetail /> },
      { path: '/teacher/exams', element: <ExamList /> },
      { path: '/teacher/exams/create', element: <ExamCreate /> },
      { path: '/teacher/exams/:examId/manage', element: <ExamManage /> },
      { path: '/teacher/reviews', element: <Reviews /> },
      { path: '/teacher/exams/:examId/review', element: <ExamReview /> },
      { path: '/teacher/sessions/:sessionId/review', element: <StudentReview /> },
      { path: '/teacher/assignments', element: <AssignmentList /> },
      { path: '/teacher/assignments/create', element: <AssignmentCreate /> },
      { path: '/teacher/assignments/:assignmentId/review', element: <AssignmentReview /> },
      { path: '/teacher/assignment-submissions/:submissionId/review', element: <AssignmentSubmissionReview /> },
    ],
  },

  { path: '*', element: <Landing /> },
]);
