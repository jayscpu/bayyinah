import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore, t } from '../stores/languageStore';

export default function FAQ() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { user } = useAuthStore();
  const { toggle } = useLanguageStore();
  const dashboardPath = user?.role === 'teacher' ? '/teacher' : '/student';

  const faqs = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
    { question: t('faq.q5'), answer: t('faq.a5') },
    { question: t('faq.q6'), answer: t('faq.a6') },
    { question: t('faq.q7'), answer: t('faq.a7') },
    { question: t('faq.q8'), answer: t('faq.a8') },
  ];

  return (
    <div className="min-h-screen paper-bg flex flex-col">
      {/* Nav bar */}
      <nav className="landing-nav" style={{ direction: 'ltr' }}>
        <div className="flex gap-8">
          <button onClick={toggle} className="hover:opacity-70 transition-opacity cursor-pointer" style={{ background: 'none', border: 'none', color: 'inherit', fontFamily: "'Amiri', serif", fontSize: '0.8rem', letterSpacing: '0.05em' }}>
            {t('lang.toggle')}
          </button>
        </div>
        <div className="flex gap-8">
          <Link to="/">{t('nav.home')}</Link>
          <Link to="/vision">{t('nav.philosophy')}</Link>
          {user ? (
            <Link to={dashboardPath}>{t('nav.dashboard')}</Link>
          ) : (
            <Link to="/login">{t('nav.signIn')}</Link>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-[700px] animate-fade-in">
          {/* Ornament */}
          <div className="flex justify-center mb-8">
            <img src="/assets/diamond.png" alt="" className="h-10 w-auto" />
          </div>

          <h1 className="font-serif text-3xl text-charcoal-800 tracking-wider uppercase text-center mb-2">
            {t('faq.title')}
          </h1>

          <hr className="dotted-divider" />

          <div className="timeline mt-8">
            {faqs.map((faq, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-bullet">
                  <img src="/assets/diamond.png" alt="" />
                </div>
                <div>
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full text-left timeline-bar hover:bg-warmgray-300 transition-colors cursor-pointer"
                  >
                    <p className="font-serif text-sm text-charcoal-800 flex-1 leading-relaxed">
                      {faq.question}
                    </p>
                  </button>
                  {expanded === i && (
                    <div className="px-6 py-4 animate-fade-in">
                      <p className="text-sm text-charcoal-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="page-footer">
        <p className="footer-quote">{t('footer.quote')}</p>
      </div>
    </div>
  );
}
