import React, { useState } from 'react';
import { Download, Calendar, User, FileText } from 'lucide-react';

const AuditLog = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (userId) params.append('userId', userId);

            const res = await fetch(`/api/logs/export?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                const data = await res.json();
                alert(data.error || 'Export failed');
            }
        } catch (e) {
            console.error(e);
            alert('Export failed');
        }
        setLoading(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto animate-fade-in">
            <div className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Audit Logs</h1>
                <p className="text-base-content/60 text-sm">Export system activity logs for compliance and review.</p>
            </div>

            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body">
                    <h2 className="card-title text-lg mb-4 flex items-center gap-2">
                        <FileText className="text-primary" /> Filter & Export
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="form-control">
                            <label className="label"><span className="label-text">Start Date</span></label>
                            <label className="input input-bordered flex items-center gap-2">
                                <Calendar size={16} className="opacity-50" />
                                <input
                                    type="date"
                                    className="grow"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label"><span className="label-text">End Date</span></label>
                            <label className="input input-bordered flex items-center gap-2">
                                <Calendar size={16} className="opacity-50" />
                                <input
                                    type="date"
                                    className="grow"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label"><span className="label-text">User ID (Optional)</span></label>
                            <label className="input input-bordered flex items-center gap-2">
                                <User size={16} className="opacity-50" />
                                <input
                                    type="number"
                                    className="grow"
                                    placeholder="e.g. 1"
                                    value={userId}
                                    onChange={e => setUserId(e.target.value)}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="card-actions justify-end mt-6">
                        <button
                            className={`btn btn-primary ${loading ? 'loading' : ''}`}
                            onClick={handleExport}
                            disabled={loading}
                        >
                            {!loading && <Download size={18} />}
                            Export CSV
                        </button>
                    </div>

                    <div className="alert alert-info mt-4 text-xs">
                        <span>Note: Only Admins can export logs. The export includes Action, User, Timestamp, and Details.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLog;
