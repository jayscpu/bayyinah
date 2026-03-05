import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore, t } from '../stores/languageStore';
import toast from 'react-hot-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const { toggle } = useLanguageStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, fullName, role);
      navigate(role === 'teacher' ? '/teacher' : '/student');
      toast.success('Account created!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen paper-bg flex flex-col">
      <Link to="/" className="fixed right-8 z-50 hover:opacity-80 transition-opacity" style={{ top: '-1.25rem' }}>
        <span className="brand-text">بيّنة</span>
      </Link>

      {/* Nav bar */}
      <nav className="landing-nav">
        <div className="flex gap-8">
          <Link to="/">{t('nav.home')}</Link>
        </div>
        <div className="flex gap-8">
          <Link to="/login">{t('nav.signIn')}</Link>
          <button onClick={toggle} className="hover:opacity-70 transition-opacity cursor-pointer" style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit' }}>
            {t('lang.toggle')}
          </button>
        </div>
      </nav>

      {/* Form centered */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Ornament */}
          <div className="flex justify-center mb-6">
            <img src="/assets/diamond.png" alt="" className="ornament-img h-10" />
          </div>

          <h1 className="font-display text-3xl text-charcoal-800 text-center mb-1">{t('register.title')}</h1>
          <p className="text-xs text-warmgray-400 text-center mb-8 uppercase tracking-wider">{t('register.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="label-caps mb-2">{t('register.fullName')}</p>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder=""
                required
                className="w-full px-4 py-2.5 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm focus:outline-none focus:border-charcoal-600"
              />
            </div>
            <div>
              <p className="label-caps mb-2">{t('register.email')}</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                required
                className="w-full px-4 py-2.5 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm focus:outline-none focus:border-charcoal-600"
              />
            </div>
            <div>
              <p className="label-caps mb-2">{t('register.password')}</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                minLength={6}
                required
                className="w-full px-4 py-2.5 bg-cream-200 border border-warmgray-200 text-charcoal-800 text-sm focus:outline-none focus:border-charcoal-600"
              />
            </div>

            {/* Role selector */}
            <div>
              <p className="label-caps mb-2">{t('register.iAmA')}</p>
              <div className="grid grid-cols-2 gap-3">
                {([{ value: 'student' as const, label: t('register.student') }, { value: 'teacher' as const, label: t('register.instructor') }]).map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`py-3 border text-center cursor-pointer transition-colors ${
                      role === r.value
                        ? 'bg-charcoal-800 text-cream-100 border-charcoal-800'
                        : 'bg-cream-200 border-warmgray-200 text-charcoal-600 hover:bg-cream-300'
                    }`}
                  >
                    <span className="font-serif text-sm">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-cream-200 border border-warmgray-200 text-xs uppercase tracking-widest text-charcoal-600 hover:text-charcoal-900 cursor-pointer transition-colors disabled:opacity-50"
            >
              {loading ? t('register.submitting') : t('register.submit')}
            </button>
          </form>

          <hr className="dotted-divider" />

          <p className="text-center text-xs text-charcoal-600">
            {t('register.hasAccount')}{' '}
            <Link to="/login" className="text-charcoal-800 font-medium hover:underline">
              {t('register.signIn')}
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="page-footer">
        <p className="footer-quote">{t('footer.quote')}</p>
      </div>
    </div>
  );
}
