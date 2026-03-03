import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
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
    <div className="min-h-screen paper-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="decorative-corners card-paper p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <Link to="/" className="inline-block mb-6">
              <span className="heading-display text-3xl text-sage-600">Bayyina</span>
            </Link>
            <h1 className="font-serif text-2xl text-charcoal-800">Create Account</h1>
            <p className="text-warmgray-400 text-xs tracking-wider mt-2 uppercase">Join Bayyina</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
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
              placeholder="Min. 6 characters"
              minLength={6}
              required
            />

            {/* Role selector */}
            <div className="space-y-2">
              <label className="label-caps">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {(['student', 'teacher'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`p-4 rounded-sm border text-center transition-all duration-200 cursor-pointer
                      ${role === r
                        ? 'border-sage-500 bg-sage-500/10 text-sage-600'
                        : 'border-warmgray-200 text-charcoal-600 hover:border-warmgray-400'
                      }`}
                  >
                    <div className="font-serif text-lg capitalize">{r}</div>
                    <div className="text-xs text-warmgray-500 mt-1">
                      {r === 'student' ? 'Take exams & learn' : 'Create exams & grade'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="ornament-divider my-8">
            <div className="ornament-diamond" />
          </div>

          <p className="text-center text-xs text-charcoal-600">
            Already have an account?{' '}
            <Link to="/login" className="text-sage-500 hover:text-sage-600 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
