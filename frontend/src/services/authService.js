import api from './api';

export const getCsrfCookie = () => {
    return api.get('/sanctum/csrf-cookie');
};

export const login = async (email, password) => {
    await getCsrfCookie();

    const response = await api.post('/api/login', {
        email,
        password,
    });

    return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get('/api/user');

    return response.data;
};

export const logout = async () => {
    const response = await api.post('/api/logout');

    return response.data;
};