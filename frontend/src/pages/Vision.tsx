import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Vision() {
  const { user } = useAuthStore();
  const dashboardPath = user?.role === 'teacher' ? '/teacher' : '/student';

  return (
    <div className="min-h-screen paper-bg flex flex-col">
      <Link to="/" className="fixed right-8 z-50 hover:opacity-80 transition-opacity" style={{ top: '-1.25rem' }}>
        <span className="brand-text">بيّنة</span>
      </Link>

      {/* Nav bar */}
      <nav className="landing-nav">
        <div className="flex gap-8">
          <Link to="/">Home</Link>
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

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-[700px] animate-fade-in">
          {/* Ornament */}
          <div className="flex justify-center mb-40">
            <img src="/assets/diamond.png" alt="" className="h-10 w-auto" />
          </div>

          <div className="mx-auto" style={{ direction: 'rtl', textAlign: 'center' }}>
            <p className="font-serif text-lg text-charcoal-800 leading-[2.2]"
               style={{ fontFamily: "'Amiri', serif" }}>
              النظام يكافئ الحفظ لا الفهم، ويصوغ من الطلاب أوعية ذاكرة لا عقول فكر،
              <br />
              من يستظهر النص كما ورد يحصد الدرجة، على عكس المتعمق بلغة لم تطابق نموذج الإجابة.
            </p>

            <p className="font-serif text-lg text-charcoal-800 leading-[2.2] mt-10"
               style={{ fontFamily: "'Amiri', serif" }}>
              بيّنة: منصة يسلّم إليها الطلاب أعمالهم ويقابلون بسؤال لا درجة،
              <br />
              نموذج ذكاء اصطناعي يستقرئ حلولهم، يتبين أمتن حججهم وأوهنها
              <br />
              ويولّد أسئلة سقراطية تدفعهم للتبرير، يصل للأستاذ حوارًا منطقيًا لا إجابة منسوخة.
            </p>

            <p className="font-serif text-lg text-charcoal-800 leading-[2.2] mt-10"
               style={{ fontFamily: "'Amiri', serif" }}>
              طالبين أحدهم حفظ والآخر فهم، والاختبار لا يواري ذلك
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="page-footer">
        <p className="footer-quote">إن للمرء عقلٌ يستضيء بهِ</p>
      </div>
    </div>
  );
}
