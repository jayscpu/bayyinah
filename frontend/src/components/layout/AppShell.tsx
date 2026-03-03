import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppShell() {
  return (
    <div className="min-h-screen paper-bg">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 max-w-6xl">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
