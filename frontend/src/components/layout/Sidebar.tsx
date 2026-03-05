import { NavLink, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore, t } from '../../stores/languageStore';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { lang, toggle } = useLanguageStore();

  const studentLinks = [
    { to: '/student', label: t('nav.home'), end: true },
    { to: '/student/courses', label: t('nav.courses') },
    { to: '/student/results', label: t('nav.results') },
  ];

  const teacherLinks = [
    { to: '/teacher', label: t('nav.home'), end: true },
    { to: '/teacher/courses', label: t('nav.courses') },
    { to: '/teacher/exams', label: t('nav.exams') },
    { to: '/teacher/reviews', label: t('nav.reviews') },
  ];

  const links = user?.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <aside className="sidebar-simple">
      <Link to="/" className="hover:opacity-80 transition-opacity" style={{ textAlign: 'center', marginTop: '-1.5rem' }}>
        <span className="brand-text" style={{ fontSize: '2.75rem' }}>بيّنة</span>
      </Link>
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
        <div style={{ marginTop: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={toggle}
            className="sidebar-signout"
            style={{ fontFamily: lang === 'en' ? "'Amiri', serif" : 'Inter, sans-serif', fontSize: '0.7rem' }}
          >
            {t('lang.toggle')}
          </button>
          <button
            onClick={logout}
            className="sidebar-signout"
          >
            {t('nav.signOut')}
          </button>
        </div>
      )}
    </aside>
  );
}
