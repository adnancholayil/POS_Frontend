import { useState, useCallback } from 'react';

export const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState(null);

  const open = useCallback((d = null) => { setData(d); setIsOpen(true); }, []);
  const close = useCallback(() => { setIsOpen(false); setTimeout(() => setData(null), 200); }, []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, data, open, close, toggle };
};
