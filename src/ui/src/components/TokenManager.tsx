import React, { useEffect, useState } from 'react';
import { Key, Trash2, Copy, Check, User, Server } from 'lucide-react';

interface Token {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string;
    assigned_user: string;
}

interface UserData {
    id: number;
    username: string;
}

interface AccountData {
    id: number;
    name: string;
}

const TokenManager = () => {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [accounts, setAccounts] = useState<AccountData[]>([]);

    const [newTokenName, setNewTokenName] = useState('');
    const [selectedUser, setSelectedUser] = useState<number | ''>('');
    const [selectedInstances, setSelectedInstances] = useState<number[]>([]);

    const [createdToken, setCreatedToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const fetchTokens = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const payload = JSON.parse(atob(token.split('.')[1]));
            setIsAdmin(payload.role === 'admin');

            const res = await fetch('/api/tokens', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTokens(data.tokens || []);
            }
        } catch (e) { console.error(e); }
    };

    const fetchMetadata = async () => {
        try {
            const token = localStorage.getItem('token');
            const [usersRes, accountsRes] = await Promise.all([
                fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/accounts', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.users || []);
            }
            if (accountsRes.ok) {
                const data = await accountsRes.json();
                setAccounts(data.accounts || []);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchTokens(); }, []);

    // Fetch metadata when modal opens
    const openModal = () => {
        fetchMetadata();
        (document.getElementById('modal_generate_token') as HTMLDialogElement).showModal();
        setCreatedToken(null);
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: newTokenName,
                    userId: Number(selectedUser),
                    instanceIds: selectedInstances
                })
            });
            const data = await res.json();
            if (res.ok) {
                setCreatedToken(data.token);
                setNewTokenName('');
                setSelectedUser('');
                setSelectedInstances([]);
                fetchTokens();
            } else {
                alert(data.error);
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Revoke this token?')) return;
        try {
            await fetch(`/api/tokens/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            fetchTokens();
        } catch (e) { console.error(e); }
    };

    const copyToClipboard = () => {
        if (createdToken) {
            navigator.clipboard.writeText(createdToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const toggleInstance = (id: number) => {
        if (selectedInstances.includes(id)) {
            setSelectedInstances(selectedInstances.filter(i => i !== id));
        } else {
            setSelectedInstances([...selectedInstances, id]);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="card bg-base-100 shadow-xl overflow-visible">
            <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title">API Tokens</h2>
                    <button className="btn btn-primary btn-sm" onClick={openModal}>
                        <Key size={16} /> Generate Token
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="table table-zebra table-sm">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Assigned To</th>
                                <th>Created</th>
                                <th>Last Used</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokens.length === 0 ? (
                                <tr><td colSpan={5} className="text-center opacity-50 p-4">No active tokens</td></tr>
                            ) : tokens.map(t => (
                                <tr key={t.id}>
                                    <td className="font-semibold">{t.name}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="opacity-70" /> {t.assigned_user}
                                        </div>
                                    </td>
                                    <td className="opacity-70">{new Date(t.created_at).toLocaleDateString()}</td>
                                    <td className="opacity-70">{t.last_used_at ? new Date(t.last_used_at).toLocaleDateString() : 'Never'}</td>
                                    <td>
                                        <button onClick={() => handleDelete(t.id)} className="btn btn-ghost btn-xs text-error">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <dialog id="modal_generate_token" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Generate Scoped Token</h3>

                    {!createdToken ? (
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Token Name</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    placeholder="e.g. CI/CD Pipeline"
                                    value={newTokenName}
                                    onChange={e => setNewTokenName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Assign to User</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={selectedUser}
                                    onChange={e => setSelectedUser(e.target.value)}
                                    required
                                >
                                    <option value="">Select User</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.username}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Allowed Accounts</span>
                                </label>
                                <div className="bg-base-200 rounded-box p-4 max-h-40 overflow-y-auto">
                                    {accounts.length === 0 && <span className="text-xs opacity-50">No accounts available</span>}
                                    {accounts.map(acc => (
                                        <div key={acc.id} className="form-control">
                                            <label className="label cursor-pointer justify-start gap-4">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm checkbox-primary"
                                                    checked={selectedInstances.includes(acc.id)}
                                                    onChange={() => toggleInstance(acc.id)}
                                                />
                                                <span className="label-text flex items-center gap-2">
                                                    <Server size={14} /> {acc.name}
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <div className="label">
                                    <span className="label-text-alt">Selected: {selectedInstances.length}</span>
                                </div>
                            </div>

                            <div className="modal-action">
                                <form method="dialog">
                                    <button className="btn btn-ghost">Cancel</button>
                                </form>
                                <button type="submit" className="btn btn-primary" disabled={!selectedUser || selectedInstances.length === 0}>Generate</button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4 animate-fade-in px-1">
                            <div className="alert alert-success">
                                <Check size={18} />
                                <span>Token generated successfully!</span>
                            </div>
                            <div className="join w-full">
                                <input type="text" className="input input-bordered join-item w-full font-mono text-sm" value={createdToken} readOnly />
                                <button className="btn join-item" onClick={copyToClipboard}>
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                            <div className="modal-action">
                                <form method="dialog">
                                    <button className="btn btn-primary">Done</button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
};

export default TokenManager;
