import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const studentLinks = [
  { to: '/student', label: 'Dashboard', end: true },
  { to: '/student/results', label: 'My Results' },
];

const teacherLinks = [
  { to: '/teacher', label: 'Dashboard', end: true },
  { to: '/teacher/courses', label: 'Courses' },
  { to: '/teacher/exams', label: 'Exams' },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const links = user?.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <aside className="w-52 sidebar-panel min-h-[calc(100vh-3.5rem)] px-3 py-6">
      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-sm text-sm transition-colors duration-150
              ${isActive
                ? 'bg-sage-500/15 text-sage-700 font-medium border-l-2 border-sage-500'
                : 'text-charcoal-600 hover:bg-cream-300/50 hover:text-charcoal-800 font-normal'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Decorative bottom element */}
      <div className="mt-auto pt-8">
        <div className="ornament-divider px-4">
          <div className="ornament-diamond" />
        </div>
      </div>
    </aside>
  );
}
