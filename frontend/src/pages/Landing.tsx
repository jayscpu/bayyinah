import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore, t } from '../stores/languageStore';

export default function Landing() {
  const { user } = useAuthStore();
  const { toggle } = useLanguageStore();

  const dashboardPath = user?.role === 'teacher' ? '/teacher' : '/student';

  return (
    <div className="min-h-screen paper-bg flex flex-col relative overflow-hidden" style={{ backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
      {/* Nav bar — thin lines top and bottom */}
      <nav className="landing-nav" style={{ direction: 'ltr' }}>
        <div className="flex gap-8">
          <button onClick={toggle} className="hover:opacity-70 transition-opacity cursor-pointer" style={{ background: 'none', border: 'none', color: 'inherit', fontFamily: "'Amiri', serif", fontSize: '0.8rem', letterSpacing: '0.05em' }}>
            {t('lang.toggle')}
          </button>
        </div>
        <div className="flex gap-8">
          <Link to="/vision">{t('nav.philosophy')}</Link>
          <Link to="/faq">{t('nav.faq')}</Link>
          {user ? (
            <Link to={dashboardPath}>{t('nav.dashboard')}</Link>
          ) : (
            <Link to="/login">{t('nav.signIn')}</Link>
          )}
        </div>
      </nav>

      {/* Tree illustration — sitting on the footer line */}
      <img
        src="/assets/12.jpeg"
        alt=""
        className="illustration absolute left-[-2%] bottom-[-3rem] h-[75vh] w-auto z-0"
      />

      {/* Bird — right side, flipped */}
      <img
        src="/assets/birdy.png"
        alt=""
        className="illustration absolute right-[12%] bottom-[20%] h-[14vh] w-auto z-0"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <h1
          className="text-[10rem] font-bold text-charcoal-800 leading-none animate-fade-in-up"
          style={{ direction: 'rtl', fontFamily: "'Aref Ruqaa', serif" }}
        >
          بيّنة
        </h1>
      </div>

      {/* Footer */}
      <div className="page-footer relative z-10">
        <p className="footer-quote">{t('footer.quote')}</p>
      </div>
    </div>
  );
}
