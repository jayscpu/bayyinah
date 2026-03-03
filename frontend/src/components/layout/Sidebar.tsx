import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const studentLinks = [
  { to: '/student', label: 'Home', end: true },
  { to: '/student/courses', label: 'Courses' },
  { to: '/student/results', label: 'Results' },
];

const teacherLinks = [
  { to: '/teacher', label: 'Home', end: true },
  { to: '/teacher/courses', label: 'Courses' },
  { to: '/teacher/exams', label: 'Exams' },
  { to: '/teacher/reviews', label: 'Reviews' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const links = user?.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <aside className="sidebar-simple">
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={'end' in link ? true : undefined}
            className={({ isActive }) =>
              `sidebar-tab ${isActive ? 'active' : ''}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <button
          onClick={logout}
          className="sidebar-signout"
        >
          Sign Out
        </button>
      )}
    </aside>
  );
}
