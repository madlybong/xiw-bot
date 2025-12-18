import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Settings, Power, Activity } from 'lucide-react';
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
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchAccounts(); }, []);

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
            // Close modal using checkbox hack or dialog method if using native dialog
            // DaisyUI recommends input toggle or dialog
            (document.getElementById('modal_add_account') as HTMLDialogElement).close();
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

    return (
        <div className="space-y-8 fade-in">
            {/* Header / Stats Section (Placeholder for future stats) */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold">Dashboard</h2>
                    <p className="opacity-70">Manage your WhatsApp Instances</p>
                </div>
                {/* <div className="stats shadow">
                  <div className="stat">
                    <div className="stat-title">Total Accounts</div>
                    <div className="stat-value">{accounts.length}</div>
                  </div>
                </div> */}
            </div>

            {/* Grid of Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Add New Card */}
                <div
                    onClick={() => (document.getElementById('modal_add_account') as HTMLDialogElement).showModal()}
                    className="card bg-base-100 shadow-xl border-2 border-dashed border-base-300 hover:border-primary cursor-pointer transition-colors h-full min-h-[300px] flex items-center justify-center group"
                >
                    <div className="flex flex-col items-center gap-2 group-hover:text-primary transition-colors">
                        <div className="p-4 bg-base-200 rounded-full group-hover:bg-primary/10">
                            <Plus size={32} />
                        </div>
                        <span className="font-semibold">Add New Instance</span>
                    </div>
                </div>

                {accounts.map(acc => (
                    <div key={acc.id} className="card bg-base-100 shadow-xl">
                        <div className="card-body p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="card-title text-xl">{acc.name}</h3>
                                    <div className="badge badge-sm mt-1 opacity-70">ID: {acc.id}</div>
                                </div>
                                <div className={`badge ${acc.status === 'running' ? 'badge-success gap-2' : 'badge-ghost gap-2'}`}>
                                    {acc.status === 'running' ? <Activity size={12} /> : <Power size={12} />}
                                    {acc.status}
                                </div>
                            </div>

                            {/* Instance Manager Component Logic would go here or be passed down */}
                            <div className="flex-grow">
                                <WhatsAppManager accountId={acc.id} />
                            </div>

                            <div className="card-actions justify-end mt-4 pt-4 border-t border-base-200">
                                <button className="btn btn-sm btn-ghost btn-square" title="Settings">
                                    <Settings size={18} />
                                </button>
                                <button onClick={() => handleDelete(acc.id)} className="btn btn-sm btn-ghost btn-square text-error" title="Delete">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="divider"></div>

            {/* Token & User Management Sections using Tabs or just vertical Layout? Vertical for now. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="col-span-1">
                    <TokenManager />
                </div>
                <div className="col-span-1">
                    <UserManager />
                </div>
            </div>

            {/* Modal */}
            <dialog id="modal_add_account" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Add New Instance</h3>
                    <form onSubmit={handleAddAccount} className="py-4">
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Instance Name</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Sales Bot"
                                className="input input-bordered w-full"
                                value={newAccountName}
                                onChange={e => setNewAccountName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="modal-action">
                            <form method="dialog">
                                {/* if there is a button in form, it will close the modal */}
                                <button className="btn btn-ghost mr-2">Cancel</button>
                            </form>
                            <button className="btn btn-primary" onClick={handleAddAccount}>Create</button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
};

export default Dashboard;
