import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function Landing() {
  return (
    <div className="min-h-screen paper-bg flex flex-col items-center justify-center">
      <div className="max-w-2xl mx-auto text-center px-6 animate-fade-in-up">
        {/* Decorative framed area */}
        <div className="decorative-corners p-16 bg-cream-50/80 backdrop-blur-sm">
          {/* Tagline */}
          <p className="label-caps mb-6 tracking-[0.3em]">
            Understanding Before Memorization
          </p>

          {/* Brand */}
          <h1 className="heading-display text-7xl text-charcoal-800 mb-3">
            Bayyina
          </h1>
          <p className="font-display text-3xl text-sage-500 italic mb-2">
            بيّنة
          </p>

          {/* Ornamental divider */}
          <div className="ornament-divider my-10 max-w-xs mx-auto">
            <div className="ornament-diamond" />
          </div>

          <p className="text-charcoal-600 leading-relaxed mb-12 max-w-md mx-auto text-sm">
            An AI-powered assessment platform that rewards deep understanding
            through Socratic dialogue — where every answer begins a conversation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button variant="primary" size="lg">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom decorative text */}
        <p className="mt-8 text-warmgray-400 text-xs tracking-[0.2em] uppercase">
          Socratic Assessment Platform
        </p>
      </div>
    </div>
  );
}
