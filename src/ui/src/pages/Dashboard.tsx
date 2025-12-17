import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Play, Square, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WhatsAppManager from '../components/WhatsAppManager';
import TokenManager from '../components/TokenManager';
import UserManager from '../components/UserManager';

interface Account {
    id: number;
    name: string;
    status: 'stopped' | 'running';
    config: string;
}

const Dashboard = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const navigate = useNavigate();

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.status === 401) navigate('/login');
            const data = await res.json();
            setAccounts(data.accounts || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/accounts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name: newAccountName, config: '{}' })
            });
            setShowAddModal(false);
            setNewAccountName('');
            fetchAccounts();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        await fetch(`/api/accounts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        fetchAccounts();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Dashboard</h1>
                    <p style={{ color: 'var(--text-sub)' }}>Manage your bot instances</p>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <button onClick={() => navigate('/docs')} style={{ background: 'transparent', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ borderBottom: '1px solid var(--accent)' }}>API Docs</span>
                    </button>
                    <button onClick={handleLogout} style={{ background: 'transparent', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Add New Card */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="glass-panel"
                    style={{
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-sub)',
                        transition: 'var(--transition)',
                        border: '2px dashed rgba(255,255,255,0.1)'
                    }}
                >
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                        <Plus size={32} />
                    </div>
                    <span>Add New Account</span>
                </button>

                {accounts.map(acc => (
                    <div key={acc.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '200px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{acc.name}</h3>
                                <div style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '99px',
                                    fontSize: '0.75rem',
                                    background: acc.status === 'running' ? 'rgba(44, 182, 125, 0.1)' : 'rgba(148, 161, 178, 0.1)',
                                    color: acc.status === 'running' ? 'var(--success)' : 'var(--text-sub)'
                                }}>
                                    {acc.status}
                                </div>
                            </div>
                            <p style={{ color: 'var(--text-sub)', fontSize: '0.875rem' }}>ID: {acc.id}</p>
                        </div>

                        <WhatsAppManager accountId={acc.id} />

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                            <button style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', display: 'flex', justifyContent: 'center' }}>
                                <Settings size={18} />
                            </button>
                            <button onClick={() => handleDelete(acc.id)} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', background: 'rgba(239, 69, 101, 0.1)', color: 'var(--error)', display: 'flex', justifyContent: 'center' }}>
                                <Trash2 size={18} />
                            </button>
                            <button style={{
                                flex: 2,
                                padding: '0.5rem',
                                borderRadius: '6px',
                                background: acc.status === 'running' ? 'rgba(239, 69, 101, 0.1)' : 'rgba(44, 182, 125, 0.1)',
                                color: acc.status === 'running' ? 'var(--error)' : 'var(--success)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                fontWeight: '600'
                            }}>
                                {acc.status === 'running' ? <><Square size={16} fill="currentColor" /> Stop</> : <><Play size={16} fill="currentColor" /> Start</>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <TokenManager />

            <UserManager />

            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="glass-panel fade-in" style={{ width: '400px', padding: '2rem', background: '#16161a' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Add Account</h3>
                        <form onSubmit={handleAddAccount}>
                            <input
                                autoFocus
                                className="input-field"
                                placeholder="Account Name"
                                value={newAccountName}
                                onChange={e => setNewAccountName(e.target.value)}
                                style={{ marginBottom: '1.5rem' }}
                            />
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ color: 'var(--text-sub)', background: 'transparent' }}>Cancel</button>
                                <button type="submit" className="btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
