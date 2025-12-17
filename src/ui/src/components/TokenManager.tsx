import React, { useEffect, useState } from 'react';
import { Key, Trash2, Copy, Check } from 'lucide-react';

interface Token {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string;
}

const TokenManager = () => {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newTokenName, setNewTokenName] = useState('');
    const [createdToken, setCreatedToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchTokens = async () => {
        try {
            const res = await fetch('/api/tokens', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setTokens(data.tokens || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchTokens();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name: newTokenName })
            });
            const data = await res.json();
            setCreatedToken(data.token);
            setNewTokenName('');
            fetchTokens();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Revoke this token?')) return;
        try {
            await fetch(`/api/tokens/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            fetchTokens();
        } catch (e) {
            console.error(e);
        }
    };

    const copyToClipboard = () => {
        if (createdToken) {
            navigator.clipboard.writeText(createdToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>API Tokens</h2>
                <button className="btn-primary" onClick={() => { setShowModal(true); setCreatedToken(null); }}>
                    <Key size={18} style={{ marginRight: '0.5rem' }} /> Generate Token
                </button>
            </header>

            <div className="glass-panel" style={{ padding: '0' }}>
                {tokens.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-sub)' }}>
                        No active API tokens.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>Created</th>
                                <th style={{ padding: '1rem' }}>Last Used</th>
                                <th style={{ padding: '1rem', width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokens.map(t => (
                                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem' }}>{t.name}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-sub)', fontSize: '0.875rem' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-sub)', fontSize: '0.875rem' }}>{t.last_used_at ? new Date(t.last_used_at).toLocaleDateString() : 'Never'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <button onClick={() => handleDelete(t.id)} style={{ color: 'var(--error)', background: 'transparent' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                    <div className="glass-panel fade-in" style={{ width: '450px', padding: '2rem', background: '#16161a' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Generate API Token</h3>

                        {!createdToken ? (
                            <form onSubmit={handleCreate}>
                                <input
                                    autoFocus
                                    className="input-field"
                                    placeholder="Token Name (e.g. CI/CD)"
                                    value={newTokenName}
                                    onChange={e => setNewTokenName(e.target.value)}
                                    style={{ marginBottom: '1.5rem' }}
                                />
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ color: 'var(--text-sub)', background: 'transparent' }}>Cancel</button>
                                    <button type="submit" className="btn-primary">Generate</button>
                                </div>
                            </form>
                        ) : (
                            <div>
                                <div style={{ background: 'rgba(44, 182, 125, 0.1)', padding: '1rem', borderRadius: '8px', color: 'var(--success)', marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Token generated successfully! Copy it now, you won't see it again.</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{createdToken}</span>
                                        <button onClick={copyToClipboard} style={{ background: 'transparent', color: 'var(--text-main)' }}>
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setShowModal(false)} className="btn-primary">Done</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TokenManager;
