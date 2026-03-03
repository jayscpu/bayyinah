import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function AppShell() {
  return (
    <div className="min-h-screen paper-bg flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-visible">
        {/* Brand بيّنة — top right, shifted left */}
        <div className="flex justify-end pt-10 pb-2 overflow-visible" style={{ paddingRight: '5%' }}>
          <Link to="/" className="brand-text hover:opacity-70 transition-opacity">بيّنة</Link>
        </div>
        {/* Content — centered */}
        <main className="flex-1 flex flex-col items-center px-8">
          <div className="w-full max-w-[700px]">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
