import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, Activity, Lock, Edit2, PauseCircle, PlayCircle, UserCog } from 'lucide-react';

interface User {
    id: number;
    username: string;
    role: string;
    status: 'active' | 'suspended';
    message_limit: number;
    message_usage: number;
    limit_frequency: string;
    created_at: string;
}

const UserManager = () => {
    const [users, setUsers] = useState<User[]>([]);

    // Form States
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [limit, setLimit] = useState(1000);
    const [frequency, setFrequency] = useState('daily');
    const [newDetail, setNewDetail] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editMode, setEditMode] = useState<'limit' | 'password' | null>(null);

    const fetchUsers = async () => {
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

    useEffect(() => { fetchUsers(); }, []);

    const openCreateModal = () => (document.getElementById('modal_create_user') as HTMLDialogElement).showModal();
    const openEditModal = (user: User, mode: 'limit' | 'password') => {
        setEditingUser(user);
        setEditMode(mode);
        setNewDetail(mode === 'limit' ? String(user.message_limit) : '');
        if (mode === 'limit') setFrequency(user.limit_frequency);
        (document.getElementById('modal_edit_user') as HTMLDialogElement).showModal();
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ username, password, role: 'agent' })
            });
            if (res.ok) {
                (document.getElementById('modal_create_user') as HTMLDialogElement).close();
                setUsername(''); setPassword('');
                fetchUsers();
            }
        } catch (e) { console.error(e); }
    };

    const toggleStatus = async (user: User) => {
        const newStatus = user.status === 'active' ? 'suspended' : 'active';
        if (!confirm(`Mark user as ${newStatus}?`)) return;

        try {
            const res = await fetch(`/api/users/${user.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                fetchUsers();
            } else {
                console.error("Failed to update status");
            }
        } catch (e) { console.error(e); }
    };

    const saveEdit = async () => {
        if (!editingUser || !editMode) return;

        if (editMode === 'password') {
            await fetch(`/api/users/${editingUser.id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ password: newDetail })
            });
        } else if (editMode === 'limit') {
            await fetch(`/api/users/${editingUser.id}/limit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ limit: Number(newDetail), frequency: frequency })
            });
        }
        (document.getElementById('modal_edit_user') as HTMLDialogElement).close();
        setNewDetail('');
        fetchUsers();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this user?')) return;
        await fetch(`/api/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        fetchUsers();
    };

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title">Agent Management</h2>
                    <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                        <UserPlus size={16} /> Add Agent
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="table table-zebra table-sm">
                        <thead>
                            <tr>
                                <th>Agent</th>
                                <th>Status</th>
                                <th>Usage</th>
                                <th>Limit</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className={u.status === 'suspended' ? 'bg-error/10' : ''}>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-bold">{u.username}</span>
                                            <span className={`text-xs ${u.role === 'admin' ? 'text-primary' : 'text-base-content/50'}`}>{u.role}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`badge badge-sm ${u.status === 'active' ? 'badge-success gap-2' : 'badge-error gap-2'}`}>
                                            {u.status === 'active' ? <PlayCircle size={10} /> : <PauseCircle size={10} />}
                                            {u.status}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Activity size={14} className="opacity-70" />
                                            {u.message_usage}
                                        </div>
                                    </td>
                                    <td className="opacity-70">
                                        {u.message_limit === -1 ? 'Unlimited' : `${u.message_limit} / ${u.limit_frequency}`}
                                    </td>
                                    <td className="text-right">
                                        {u.role !== 'admin' && (
                                            <div className="join">
                                                <button onClick={() => toggleStatus(u)} className="btn btn-xs join-item btn-ghost" title={u.status === 'active' ? "Suspend" : "Activate"}>
                                                    {u.status === 'active' ? <PauseCircle size={16} className="text-warning" /> : <PlayCircle size={16} className="text-success" />}
                                                </button>
                                                <button onClick={() => openEditModal(u, 'limit')} className="btn btn-xs join-item btn-ghost" title="Edit Limits">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => openEditModal(u, 'password')} className="btn btn-xs join-item btn-ghost" title="Reset Password">
                                                    <Lock size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(u.id)} className="btn btn-xs join-item btn-ghost text-error" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                        {u.role === 'admin' && <span className="text-xs opacity-50 italic">Admin</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <dialog id="modal_create_user" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Add New Agent</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Username</span>
                            </label>
                            <input className="input input-bordered" placeholder="username" value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Password</span>
                            </label>
                            <input type="password" className="input input-bordered" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <div className="modal-action">
                            <form method="dialog"><button className="btn btn-ghost">Cancel</button></form>
                            <button type="submit" className="btn btn-primary">Create Agent</button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop"><button>close</button></form>
            </dialog>

            {/* Edit Modal */}
            <dialog id="modal_edit_user" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-2">
                        {editMode === 'password' ? 'Reset Password' : 'Edit Limits'}
                    </h3>
                    <p className="text-sm opacity-70 mb-4">User: <span className="font-bold">{editingUser?.username}</span></p>

                    <div className="space-y-4">
                        {editMode === 'limit' ? (
                            <>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Message Limit</span></label>
                                    <input className="input input-bordered" type="number" value={newDetail} onChange={e => setNewDetail(e.target.value)} />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Frequency</span></label>
                                    <select className="select select-bordered" value={frequency} onChange={e => setFrequency(e.target.value)}>
                                        <option value="daily">Daily</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="unlimited">Unlimited</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            <div className="form-control">
                                <label className="label"><span className="label-text">New Password</span></label>
                                <input className="input input-bordered" type="text" placeholder="New Password" value={newDetail} onChange={e => setNewDetail(e.target.value)} autoFocus />
                            </div>
                        )}
                    </div>

                    <div className="modal-action">
                        <form method="dialog"><button className="btn btn-ghost">Cancel</button></form>
                        <button onClick={saveEdit} className="btn btn-primary">Save Changes</button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop"><button>close</button></form>
            </dialog>
        </div>
    );
};

export default UserManager;
