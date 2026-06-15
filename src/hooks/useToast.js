import { useDispatch } from 'react-redux';
import { addToast } from '../features/ui/uiSlice';

export const useToast = () => {
  const dispatch = useDispatch();

  const toast = (message, type = 'info', duration = 3500) => {
    dispatch(addToast({ message, type, duration }));
  };

  return {
    toast,
    success: (msg, dur) => toast(msg, 'success', dur),
    error:   (msg, dur) => toast(msg, 'error', dur),
    warning: (msg, dur) => toast(msg, 'warning', dur),
    info:    (msg, dur) => toast(msg, 'info', dur),
  };
};
