import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore, t } from '../stores/languageStore';
import toast from 'react-hot-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuthStore();
  const { toggle } = useLanguageStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const timeout = setTimeout(() => {
      setLoading(false);
      setError('Request timed out. Please try again.');
    }, 10000);
    try {
      await register(email, password, nameEn || nameAr || '', role, nameEn, nameAr);
      clearTimeout(timeout);
      navigate(role === 'teacher' ? '/teacher' : '/student');
      toast.success('Account created!');
    } catch (err: any) {
      clearTimeout(timeout);
      const msg = err.response?.data?.detail || err.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
          <Link to="/login">{t('nav.signIn')}</Link>
        </div>
      </nav>

      {/* Form centered */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Ornament */}
          <div className="flex justify-center mb-6">
            <img src="/assets/diamond.png" alt="" className="ornament-img h-10" />
          </div>

          <h1 className="font-display text-3xl text-charcoal-800 text-center mb-1">{t('register.title')}</h1>
          <p className="text-xs text-warmgray-400 text-center mb-8 uppercase tracking-wider">{t('register.subtitle')}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <p className="label-caps mb-3">{t('register.nameEn')}</p>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder=""
                className="w-full px-8 py-6 paper-warm border border-warmgray-200 text-charcoal-800 text-sm focus:outline-none focus:border-charcoal-600"
              />
            </div>
            <div>
              <p className="label-caps mb-3">{t('register.nameAr')}</p>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder=""
                dir="rtl"
                className="w-full px-8 py-6 paper-warm border border-warmgray-200 text-charcoal-800 text-sm focus:outline-none focus:border-charcoal-600"
              />
            </div>
            <div>
              <p className="label-caps mb-3">{t('register.email')}</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                required
                className="w-full px-8 py-6 paper-warm border border-warmgray-200 text-charcoal-800 text-sm focus:outline-none focus:border-charcoal-600"
              />
            </div>
            <div>
              <p className="label-caps mb-3">{t('register.password')}</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                minLength={6}
                required
                className="w-full px-8 py-6 paper-warm border border-warmgray-200 text-charcoal-800 text-sm focus:outline-none focus:border-charcoal-600"
              />
            </div>

            {/* Role selector */}
            <div>
              <p className="label-caps mb-3">{t('register.iAmA')}</p>
              <div className="grid grid-cols-2 gap-4">
                {([{ value: 'student' as const, label: t('register.student') }, { value: 'teacher' as const, label: t('register.instructor') }]).map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`py-5 border text-center cursor-pointer transition-colors ${
                      role === r.value
                        ? 'border-charcoal-800 text-charcoal-800 font-semibold'
                        : 'paper-warm border-warmgray-200 text-charcoal-600 hover:bg-cream-300'
                    }`}
                    style={role === r.value ? { backgroundColor: '#D5CCBE', borderColor: '#4A4A4A' } : {}}
                  >
                    <span className="font-serif text-sm">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 px-14 py-11 border label-caps cursor-pointer transition-colors disabled:opacity-50" style={{ backgroundColor: '#D5CCBE', borderColor: '#C4BCB0', color: '#4A4A4A', fontSize: '0.85rem', letterSpacing: '0' }}
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
