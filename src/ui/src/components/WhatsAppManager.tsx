import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle, CheckCircle, Power, LogOut } from 'lucide-react';

interface Props {
    accountId: number;
}

const WhatsAppManager = ({ accountId }: Props) => {
    const [status, setStatus] = useState<'stopped' | 'connecting' | 'connected' | 'disconnected'>('stopped');
    const [qr, setQr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<{ name?: string, id: string } | undefined>(undefined);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/wa/status/${accountId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setStatus(data.status);
            setQr(data.qr);
            setUser(data.user);
        } catch (e) {
            console.error('Failed to fetch WA status', e);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
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
        } catch (e) { console.error(e); } finally { setLoading(false); }
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
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    // Helper to determine step index
    const getStepIndex = () => {
        switch (status) {
            case 'connected': return 2;
            case 'connecting': return 1;
            default: return 0;
        }
    }

    return (
        <div className="flex flex-col h-full justify-between gap-4">
            {/* Steps (optional visual) or just Badge */}
            <ul className="steps steps-vertical lg:steps-horizontal w-full text-xs opacity-70 mb-2">
                <li className={`step ${getStepIndex() >= 0 ? 'step-primary' : ''}`}>Stopped</li>
                <li className={`step ${getStepIndex() >= 1 ? 'step-primary' : ''}`}>Connecting</li>
                <li className={`step ${getStepIndex() >= 2 ? 'step-primary' : ''}`}>Active</li>
            </ul>

            {/* Content Area */}
            <div className="flex-grow flex flex-col items-center justify-center p-2">
                {status === 'stopped' && (
                    <button onClick={handleStart} className="btn btn-primary w-full" disabled={loading}>
                        {loading ? <span className="loading loading-spinner"></span> : <Power size={18} />}
                        Start Session
                    </button>
                )}

                {status === 'connecting' && (
                    <div className="text-center w-full">
                        <button className="btn btn-ghost w-full mb-2" disabled>
                            <span className="loading loading-dots loading-lg"></span>
                        </button>
                        {qr ? (
                            <button className="btn btn-sm btn-outline" onClick={() => (document.getElementById(`modal_qr_${accountId}`) as HTMLDialogElement).showModal()}>Show QR</button>
                        ) : <span className="text-xs opacity-50">Checking QR...</span>}
                    </div>
                )}

                {status === 'connected' && (
                    <div className="stats shadow w-full bg-base-200">
                        <div className="stat p-4">
                            <div className="stat-figure text-success">
                                <CheckCircle size={32} />
                            </div>
                            <div className="stat-title text-xs">Connected As</div>
                            <div className="stat-value text-sm truncate">{user?.name || 'Unknown'}</div>
                            <div className="stat-desc text-xs text-secondary truncate">{user?.id?.split('@')[0]}</div>
                        </div>
                    </div>
                )}

                {status === 'disconnected' && (
                    <div role="alert" className="alert alert-error text-xs">
                        <AlertCircle size={16} />
                        <span>Connection Lost!</span>
                        <button className="btn btn-xs btn-ghost" onClick={handleStart}>Retry</button>
                    </div>
                )}
            </div>

            {/* Disconnect Button if Connected */}
            {status === 'connected' && (
                <button onClick={handleLogout} className="btn btn-outline btn-error btn-sm w-full" disabled={loading}>
                    <LogOut size={14} /> Disconnect
                </button>
            )}

            {/* QR Modal */}
            <dialog id={`modal_qr_${accountId}`} className="modal">
                <div className="modal-box flex flex-col items-center">
                    <h3 className="font-bold text-lg mb-4">Scan QR Code</h3>
                    {qr && <div className="bg-white p-4 rounded-xl"><QRCodeSVG value={qr} size={250} /></div>}
                    <p className="py-4 text-sm opacity-70">Open WhatsApp &gt; Settings &gt; Linked Devices</p>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn" onClick={() => setStatus('stopped')}>Cancel</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default WhatsAppManager;
