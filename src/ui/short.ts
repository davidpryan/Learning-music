import { useEffect, useState } from 'react';
/** True on short screens (a folded iPhone Duo, a phone on its side, a browser with tall toolbars). Follows rotation and folding. */
export function useShort(maxHeight = 720) {
  const q = `(max-height: ${maxHeight}px)`; const [v, setV] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches);
  useEffect(() => { if (typeof matchMedia === 'undefined') return; const m = matchMedia(q), h = () => setV(m.matches); h(); m.addEventListener('change', h); return () => m.removeEventListener('change', h); }, [q]);
  return v;
}
