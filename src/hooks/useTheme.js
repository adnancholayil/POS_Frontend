import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme, setTheme, selectTheme } from '../features/theme/themeSlice';

export const useTheme = () => {
  const dispatch = useDispatch();
  const mode = useSelector(selectTheme);
  return {
    mode,
    isDark: mode === 'dark',
    toggle: () => dispatch(toggleTheme()),
    setLight: () => dispatch(setTheme('light')),
    setDark:  () => dispatch(setTheme('dark')),
  };
};
