import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import AuditLog from './pages/AuditLog';
import Documentation from './pages/Documentation';
import Navbar from './components/Navbar';

const Layout = () => {
    const [auth, setAuth] = useState(false);

    useEffect(() => {
        const checkAuth = () => setAuth(!!localStorage.getItem('token'));
        checkAuth();
        window.addEventListener('storage', checkAuth);
        window.addEventListener('auth-change', checkAuth);

        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('auth-change', checkAuth);
        };
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-change'));
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-base-300 font-sans text-base-content">
            {auth && <Navbar isLoggedIn={auth} onLogout={logout} />}
            <div className="container mx-auto p-4 max-w-7xl">
                <Routes>
                    <Route path="/login" element={!auth ? <Login /> : <Navigate to="/" />} />
                    <Route path="/" element={auth ? <Dashboard /> : <Navigate to="/login" />} />
                    <Route path="/dashboard" element={auth ? <Dashboard /> : <Navigate to="/login" />} />
                    <Route path="/contacts" element={auth ? <Contacts /> : <Navigate to="/login" />} />
                    <Route path="/logs" element={auth ? <AuditLog /> : <Navigate to="/login" />} />
                    <Route path="/docs" element={<Documentation />} />
                </Routes>
            </div>
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Layout />
        </BrowserRouter>
    );
}

export default App;
