import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function AppShell() {
  useEffect(() => {
    const el = document.querySelector('.paper-bg') as HTMLElement;
    if (el) {
      el.style.backgroundImage = "url('/assets/courses-bg.jpeg')";
      el.style.backgroundSize = '50% 50%';
      el.style.backgroundRepeat = 'repeat';
      el.style.backgroundPosition = 'top left';
    }
    return () => {
      if (el) {
        el.style.backgroundImage = '';
        el.style.backgroundSize = '';
        el.style.backgroundRepeat = '';
        el.style.backgroundPosition = '';
      }
    };
  }, []);

  return (
    <div className="min-h-screen paper-bg flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-visible">
        {/* Content — centered */}
        <main className="flex-1 flex flex-col items-center px-8" style={{ paddingTop: '80px' }}>
          <div className="w-full max-w-[900px]">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
