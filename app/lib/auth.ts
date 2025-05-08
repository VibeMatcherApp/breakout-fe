import { AuthContext } from '@/context/AuthContext';

export const login = (userId: number) => {
    // Get user ID from localStorage
    localStorage.setItem('userId', userId.toString());
}; 