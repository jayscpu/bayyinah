import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore, t } from '../stores/languageStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const { toggle } = useLanguageStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const { user } = useAuthStore.getState();
      navigate(user?.role === 'teacher' ? '/teacher' : '/student');
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen paper-bg flex flex-col">
      {/* Nav bar — matching landing page */}
      <nav className="landing-nav">
        <div className="flex gap-8">
          <Link to="/">{t('nav.home')}</Link>
        </div>
        <div className="flex gap-8">
          <Link to="/register">{t('nav.register')}</Link>
          <button onClick={toggle} className="hover:opacity-70 transition-opacity cursor-pointer" style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit' }}>
            {t('lang.toggle')}
          </button>
        </div>
      </nav>

      {/* Form centered */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Ornament */}
          <div className="flex justify-center mb-6">
            <img src="/assets/diamond.png" alt="" className="ornament-img h-10" />
          </div>

          <h1 className="font-display text-3xl text-charcoal-800 text-center mb-1">{t('login.title')}</h1>
          <p className="text-xs text-warmgray-400 text-center mb-8 uppercase tracking-wider">{t('login.subtitle')}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <p className="label-caps mb-3">{t('login.email')}</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                required
                className="w-full px-6 py-5 paper-warm border border-warmgray-200 text-charcoal-800 text-sm focus:outline-none focus:border-charcoal-600"
              />
            </div>
            <div>
              <p className="label-caps mb-3">{t('login.password')}</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                required
                className="w-full px-6 py-5 paper-warm border border-warmgray-200 text-charcoal-800 text-sm focus:outline-none focus:border-charcoal-600"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 px-10 py-10 border label-caps cursor-pointer transition-colors disabled:opacity-50" style={{ backgroundColor: '#D5CCBE', borderColor: '#C4BCB0', color: '#4A4A4A', fontSize: '0.85rem', letterSpacing: '0' }}
            >
              {loading ? t('login.submitting') : t('login.submit')}
            </button>
          </form>

          <hr className="dotted-divider" />

          <p className="text-center text-xs text-charcoal-600">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-charcoal-800 font-medium hover:underline">
              {t('login.createOne')}
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
