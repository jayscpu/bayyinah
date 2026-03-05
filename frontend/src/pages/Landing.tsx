import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Landing() {
  const { user } = useAuthStore();

  const dashboardPath = user?.role === 'teacher' ? '/teacher' : '/student';

  return (
    <div className="min-h-screen paper-bg flex flex-col relative overflow-hidden">
      {/* Logo — top right */}
      <Link to="/" className="fixed top-2 right-8 z-50 hover:opacity-80 transition-opacity">
        <span className="brand-text">بيّنة</span>
      </Link>

      {/* Nav bar — thin lines top and bottom */}
      <nav className="landing-nav">
        <div className="flex gap-8">
          <Link to="/vision">Philosophy</Link>
        </div>
        <div className="flex gap-8">
          <Link to="/faq">FAQ</Link>
          {user ? (
            <Link to={dashboardPath}>Dashboard</Link>
          ) : (
            <Link to="/login">Sign In</Link>
          )}
        </div>
      </nav>

      {/* Tree illustration — sitting on the footer line */}
      <img
        src="/assets/12.jpeg"
        alt=""
        className="illustration absolute left-[-2%] bottom-[0.5rem] h-[75vh] w-auto z-0"
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
        <p className="footer-quote">إن للمرء عقلٌ يستضيء بهِ</p>
      </div>
    </div>
  );
}
