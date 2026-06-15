import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated, selectUserRole } from '../features/auth/authSlice';
import { ROLES } from '../utils/constants';

export const useAuth = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectUserRole);

  return {
    user,
    isAuthenticated,
    role,
    isAdmin:    role === ROLES.ADMIN,
    isManager:  role === ROLES.MANAGER,
    isSalesman: role === ROLES.SALESMAN,
    isAdminOrManager: role === ROLES.ADMIN || role === ROLES.MANAGER,
    hasRole: (...roles) => roles.includes(role),
  };
};
