import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, AlertCircle, CheckCircle, LogOut, Power } from 'lucide-react';

interface Props {
    accountId: number;
}

const WhatsAppManager = ({ accountId }: Props) => {
    const [status, setStatus] = useState<'stopped' | 'connecting' | 'connected' | 'disconnected'>('stopped');
    const [qr, setQr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/wa/status/${accountId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setStatus(data.status);
            setQr(data.qr);
        } catch (e) {
            console.error('Failed to fetch WA status', e);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [accountId]);

    const handleStart = async () => {
        setLoading(true);
        try {
            await fetch(`/api/wa/start/${accountId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            await fetchStatus();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (!confirm('Disconnect WhatsApp session?')) return;
        setLoading(true);
        try {
            await fetch(`/api/wa/logout/${accountId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            await fetchStatus();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    WA Status
                    {status === 'connected' && <CheckCircle size={14} color="var(--success)" />}
                    {status === 'disconnected' && <AlertCircle size={14} color="var(--error)" />}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', textTransform: 'capitalize' }}>
                    {status}
                </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
                {status === 'stopped' && (
                    <button onClick={handleStart} className="btn-primary" style={{ width: '100%', fontSize: '0.875rem', padding: '0.5rem' }} disabled={loading}>
                        {loading ? <Loader2 className="spin" size={14} /> : <Power size={14} />}
                        Start
                    </button>
                )}

                {status === 'connecting' && (
                    <button className="btn-primary" style={{ width: '100%', fontSize: '0.875rem', padding: '0.5rem', background: 'var(--accent)' }} disabled>
                        <Loader2 className="spin" size={14} /> Connecting...
                    </button>
                )}

                {status === 'connected' && (
                    <button onClick={handleLogout} style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid var(--error)',
                        color: 'var(--error)',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                    }} disabled={loading}>
                        <LogOut size={14} /> Disconnect
                    </button>
                )}
            </div>

            {/* QR Code Modal */}
            {status === 'connecting' && qr && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                    <div className="glass-panel fade-in" style={{ padding: '2rem', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <h3 style={{ color: '#000', fontSize: '1.25rem', fontWeight: 'bold' }}>Scan QR Code</h3>
                        <QRCodeSVG value={qr} size={250} />
                        <p style={{ color: '#666', fontSize: '0.875rem' }}>Open WhatsApp &gt; Settings &gt; Linked Devices</p>
                        <button onClick={() => setStatus('stopped')} style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            background: '#f0f0f0',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
};

export default WhatsAppManager;
