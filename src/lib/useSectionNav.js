import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLenis, scrollToTarget } from './lenis';

/** Returns `go(id)` which scrolls to a home-page section from anywhere. */
export default function useSectionNav() {
  const lenis = useLenis();
  const location = useLocation();
  const navigate = useNavigate();

  return useCallback(
    (id) => {
      if (location.pathname === '/') scrollToTarget(lenis, id);
      else navigate('/', { state: { section: id } });
    },
    [lenis, location.pathname, navigate]
  );
}
