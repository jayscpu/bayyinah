import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './router';
import { useAuthStore } from './stores/authStore';
import { useLanguageStore } from './stores/languageStore';

export default function App() {
  const { isAuthenticated, fetchUser } = useAuthStore();
  const lang = useLanguageStore((s) => s.lang);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#F5F0E8',
            color: '#2A2A2A',
            border: '1px solid #C4BCB0',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
    </>
  );
}
