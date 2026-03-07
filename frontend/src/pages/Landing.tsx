import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore, t } from '../stores/languageStore';

export default function Landing() {
  const { user } = useAuthStore();
  const { toggle } = useLanguageStore();

  const dashboardPath = user?.role === 'teacher' ? '/teacher' : '/student';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(to left, #F6EFE0 50%, transparent 50%)' }}>
      {/* Background image on left half only */}
      <div className="absolute inset-0 paper-bg" style={{ clipPath: 'inset(0 50% 0 0)' }} />
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

      {/* بيّنة title */}
      <div className="absolute z-10 animate-fade-in-up" style={{ right: '12%', top: '12%', direction: 'rtl' }}>
        <h1
          className="text-[14rem] font-bold text-charcoal-800 leading-none"
          style={{ fontFamily: "'Aref Ruqaa', serif" }}
        >
          بيّنة
        </h1>
      </div>

      {/* Philosophy text */}
      <div className="absolute z-10 animate-fade-in-up" style={{ right: '14%', top: '50%', transform: 'translateY(-50%)', direction: 'rtl', textAlign: 'justify', maxWidth: '420px' }}>
        <p className="text-charcoal-800 leading-[2]" style={{ fontFamily: "'Amiri', serif", fontSize: '0.95rem' }}>
          النظام يكافئ الحفظ لا الفهم، ويصوغ من الطلاب أوعية ذاكرة لا عقول فكر،
          من يستظهر النص كما ورد يحصد الدرجة، على عكس المتعمق بلغة لم تطابق نموذج الإجابة.
        </p>
        <p className="text-charcoal-800 leading-[2] mt-6" style={{ fontFamily: "'Amiri', serif", fontSize: '0.95rem' }}>
          بيّنة: منصة يسلّم إليها الطلاب أعمالهم ويقابلون بسؤال لا درجة،
          نموذج ذكاء اصطناعي يستقرئ حلولهم، يتبين أمتن حججهم وأوهنها
          ويولّد أسئلة سقراطية تدفعهم للتبرير، يصل للأستاذ حوارًا منطقيًا لا إجابة منسوخة.
        </p>
      </div>
    </div>
  );
}
