import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import AppBottomNavigation from '../components/BottomNavigation';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}

export default function AppLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
      <AppBottomNavigation />
    </>
  );
}
