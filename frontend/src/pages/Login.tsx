import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
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
    <div className="min-h-screen paper-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="decorative-corners card-paper p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <Link to="/" className="inline-block mb-6">
              <span className="heading-display text-3xl text-sage-600">Bayyina</span>
            </Link>
            <h1 className="font-serif text-2xl text-charcoal-800">Sign In</h1>
            <p className="text-warmgray-400 text-xs tracking-wider mt-2 uppercase">Welcome back</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="ornament-divider my-8">
            <div className="ornament-diamond" />
          </div>

          <p className="text-center text-xs text-charcoal-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-sage-500 hover:text-sage-600 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
