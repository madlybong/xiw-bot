import React, { useEffect, useState } from 'react';
import { Search, Plus, Upload, Download, Trash2, Edit2, User, Phone, Mail, Tag, Save, X, FileDown } from 'lucide-react';

interface Contact {
    id: number;
    name: string;
    phone: string;
    email: string;
    tags: string;
    notes: string;
    source: string;
    created_at: string;
}

const Contacts = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form Stats
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', tags: '', notes: ''
    });

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/contacts', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setContacts(data.contacts || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchContacts(); }, []);

    const filteredContacts = contacts.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.tags?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingContact ? `/api/contacts/${editingContact.id}` : '/api/contacts';
        const method = editingContact ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                closeModal();
                fetchContacts();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this contact?')) return;
        try {
            await fetch(`/api/contacts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            fetchContacts();
        } catch (e) { console.error(e); }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/contacts/import', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                alert(`Imported ${data.count} contacts successfully.`);
                fetchContacts();
            } else {
                alert('Import failed: ' + data.details);
            }
        } catch (e) { console.error(e); }
        e.target.value = ''; // Reset input
    };

    const handleExport = () => {
        window.open('/api/contacts/export?token=' + localStorage.getItem('token'), '_blank');
        // Note: Adding token as query param is one way, but standard way uses Header. 
        // Since window.open can't set headers, we might need a workaround or fetch+blob download.
        // Let's implement fetch+blob for security.
        downloadExport();
    };

    const downloadExport = async () => {
        try {
            const res = await fetch('/api/contacts/export', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'contacts.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) { console.error(e); }
    }

    const openEdit = (c: Contact) => {
        setEditingContact(c);
        setFormData({ name: c.name || '', phone: c.phone, email: c.email || '', tags: c.tags || '', notes: c.notes || '' });
        (document.getElementById('contact_modal') as HTMLDialogElement).showModal();
    }

    const openCreate = () => {
        setIsCreating(true);
        setEditingContact(null);
        setFormData({ name: '', phone: '', email: '', tags: '', notes: '' });
        (document.getElementById('contact_modal') as HTMLDialogElement).showModal();
    }

    const closeModal = () => {
        (document.getElementById('contact_modal') as HTMLDialogElement).close();
        setIsCreating(false);
        setEditingContact(null);
    }

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Address Book</h1>
                    <p className="text-base-content/60 text-sm">Manage your global contact list</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline gap-2" onClick={handleExport}>
                        <Download size={18} /> Export CSV
                    </button>
                    <label className="btn btn-outline gap-2">
                        <Upload size={18} /> Import CSV
                        <input type="file" className="hidden" accept=".csv" onChange={handleImport} />
                    </label>
                    <button className="btn btn-primary gap-2" onClick={openCreate}>
                        <Plus size={18} /> Add Contact
                    </button>
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-4">
                    <div className="flex items-center gap-2 mb-4 bg-base-200 p-2 rounded-lg">
                        <Search size={20} className="text-base-content/50 ml-2" />
                        <input
                            type="text"
                            className="bg-transparent border-none outline-none w-full text-base-content"
                            placeholder="Search contacts..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto h-[600px] overflow-y-auto">
                        <table className="table table-zebra table-pin-rows">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Tags</th>
                                    <th>Source</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContacts.map(c => (
                                    <tr key={c.id} className="hover">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="avatar placeholder">
                                                    <div className="bg-neutral text-neutral-content rounded-full w-10">
                                                        <span>{c.name ? c.name.charAt(0).toUpperCase() : '#'}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-bold">{c.name || 'Unknown'}</div>
                                                    <div className="text-xs opacity-50 flex items-center gap-1">
                                                        <Mail size={10} /> {c.email || 'No Email'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="font-mono text-sm">
                                            {c.phone}
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {c.tags ? c.tags.split(',').map((t, i) => (
                                                    <span key={i} className="badge badge-ghost badge-sm">{t.trim()}</span>
                                                )) : <span className="text-xs opacity-30">-</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-sm ${c.source === 'auto' ? 'badge-primary badge-outline' : 'badge-ghost'}`}>
                                                {c.source}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <button className="btn btn-ghost btn-xs" onClick={() => openEdit(c)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(c.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredContacts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 opacity-50">
                                            No contacts found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <dialog id="contact_modal" className="modal">
                <div className="modal-box w-11/12 max-w-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">{isCreating ? 'Create Contact' : 'Edit Contact'}</h3>
                        <button className="btn btn-ghost btn-sm btn-circle" onClick={closeModal}><X size={20} /></button>
                    </div>

                    <form onSubmit={handleSave} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text">Name</span></label>
                                <label className="input input-bordered flex items-center gap-2">
                                    <User size={16} className="opacity-50" />
                                    <input type="text" className="grow" placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </label>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Phone (Required)</span></label>
                                <label className="input input-bordered flex items-center gap-2">
                                    <Phone size={16} className="opacity-50" />
                                    <input type="text" className="grow" placeholder="e.g. 1234567890" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                                </label>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Email</span></label>
                                <label className="input input-bordered flex items-center gap-2">
                                    <Mail size={16} className="opacity-50" />
                                    <input type="email" className="grow" placeholder="user@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </label>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Tags (comma separated)</span></label>
                                <label className="input input-bordered flex items-center gap-2">
                                    <Tag size={16} className="opacity-50" />
                                    <input type="text" className="grow" placeholder="client, lead, vip" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                                </label>
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label"><span className="label-text">Notes</span></label>
                            <textarea className="textarea textarea-bordered h-24" placeholder="Add some notes..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                        </div>

                        <div className="modal-action">
                            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                            <button type="submit" className="btn btn-primary">
                                <Save size={18} /> Save Contact
                            </button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={closeModal}>close</button>
                </form>
            </dialog>
        </div>
    );
};

export default Contacts;
