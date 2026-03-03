import { useAuthStore } from '../../stores/authStore';
import Button from '../ui/Button';

export default function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-14 paper-texture border-b border-warmgray-200 flex items-center justify-between px-8">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl text-charcoal-800 tracking-wide">
          <span className="text-sage-600">Bayyina</span>
          <span className="text-warmgray-400 text-xs ml-2 font-sans">بيّنة</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-xs text-charcoal-600 tracking-wide">
              {user.full_name}
              <span className="text-warmgray-400 ml-1.5 capitalize">({user.role})</span>
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
