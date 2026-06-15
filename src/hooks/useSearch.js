import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from '../utils/helpers';

export const useSearch = (initialQuery = '', delay = 350) => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  const debouncedSet = useRef(debounce((v) => setDebouncedQuery(v), delay)).current;

  const handleChange = useCallback((value) => {
    setQuery(value);
    debouncedSet(value);
  }, [debouncedSet]);

  const clear = useCallback(() => { setQuery(''); setDebouncedQuery(''); }, []);

  return { query, debouncedQuery, handleChange, clear };
};
