import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function AppShell() {
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
