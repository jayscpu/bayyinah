import { NavLink, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore, t } from '../../stores/languageStore';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { lang, toggle } = useLanguageStore();

  const studentLinks = [
    { to: '/student', label: t('nav.home'), end: true },
    { to: '/student/courses', label: t('nav.courses') },
    { to: '/student/exams', label: t('nav.exams') },
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1.25rem' }}>
        <Link to="/" className="hover:opacity-80 transition-opacity" style={{ textAlign: 'center' }}>
          <span className="brand-text" style={{ fontSize: '4rem' }}>بيّنة</span>
        </Link>
        <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '1.5rem', gap: '0.25rem' }}>
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
      </div>

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
