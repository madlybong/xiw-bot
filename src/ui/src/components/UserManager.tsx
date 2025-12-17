import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';

interface User {
    id: number;
    username: string;
    role: string;
    created_at: string;
}

const UserManager = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('agent');
    const [error, setError] = useState('');

    // NOTE: This component assumes we have an API for listing/creating users.
    // The plan mentioned "API: User CRUD (Admin only)" which might not be implemented in server/index.ts yet.
    // I will need to check/implement that backend part too.

    const fetchUsers = async () => {
        // Placeholder for now, waiting for API implementation
        // setUsers([{id: 1, username: 'admin', role: 'admin', created_at: new Date().toISOString()}]);
        try {
            const res = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ username, password, role })
            });

            if (!res.ok) throw new Error('Failed to create user');

            setShowModal(false);
            setUsername('');
            setPassword('');
            fetchUsers();
        } catch (e) {
            setError('Failed to create user');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this user?')) return;
        await fetch(`/api/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        fetchUsers();
    }

    return (
        <div style={{ marginTop: '3rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>User Management</h2>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <UserPlus size={18} style={{ marginRight: '0.5rem' }} /> Add User
                </button>
            </header>

            <div className="glass-panel" style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Username</th>
                            <th style={{ padding: '1rem' }}>Role</th>
                            <th style={{ padding: '1rem' }}>Created</th>
                            <th style={{ padding: '1rem', width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem' }}>{u.username}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        background: u.role === 'admin' ? 'rgba(127, 90, 240, 0.2)' : 'rgba(44, 182, 125, 0.2)',
                                        color: u.role === 'admin' ? '#7f5af0' : '#2cb67d',
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase'
                                    }}>
                                        {u.role}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-sub)', fontSize: '0.875rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '1rem' }}>
                                    {u.role !== 'admin' && (
                                        <button onClick={() => handleDelete(u.id)} style={{ color: 'var(--error)', background: 'transparent' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                    <div className="glass-panel fade-in" style={{ width: '400px', padding: '2rem', background: '#16161a' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Add New User</h3>
                        {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}
                        <form onSubmit={handleCreate}>
                            <input
                                className="input-field"
                                placeholder="Username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                style={{ marginBottom: '1rem' }}
                            />
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ marginBottom: '1rem' }}
                            />
                            <select
                                className="input-field"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                style={{ marginBottom: '1.5rem' }}
                            >
                                <option value="agent">Agent</option>
                                <option value="admin">Admin</option>
                            </select>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ color: 'var(--text-sub)', background: 'transparent' }}>Cancel</button>
                                <button type="submit" className="btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManager;
