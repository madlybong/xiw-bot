import React, { useEffect, useState } from 'react';
import { Download, ArrowLeft, Terminal, Shield, Key, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Documentation = () => {
    const navigate = useNavigate();
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        setBaseUrl(window.location.origin);
    }, []);

    const CodeBlock = ({ children, title }: { children: React.ReactNode, title?: string }) => (
        <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
            {title && <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '0.25rem' }}>{title}</div>}
            <pre style={{
                background: '#16161a',
                padding: '1rem',
                borderRadius: '8px',
                overflowX: 'auto',
                border: '1px solid rgba(255,255,255,0.1)',
                margin: 0
            }}>
                <code style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#a8b1ff' }}>
                    {children}
                </code>
            </pre>
        </div>
    );

    const Endpoint = ({ method, url, desc }: { method: string, url: string, desc: string }) => (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                    fontWeight: 'bold',
                    color: method === 'GET' ? 'var(--success)' : method === 'POST' ? 'var(--accent)' : 'var(--error)',
                    background: method === 'GET' ? 'rgba(44, 182, 125, 0.1)' : method === 'POST' ? 'rgba(127, 90, 240, 0.1)' : 'rgba(239, 69, 101, 0.1)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                }}>{method}</span>
                <code style={{ fontSize: '0.9rem' }}>{baseUrl}{url}</code>
            </div>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.875rem', margin: 0 }}>{desc}</p>
        </div>
    );

    return (
        <div className="fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', color: 'var(--text-sub)', padding: 0 }}>
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>API Documentation</h1>
                        <p style={{ color: 'var(--text-sub)' }}>Integrate XiW Bot into your applications</p>
                    </div>
                </div>
                <a href="/xiw-bot.postman_collection.json" download className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <Download size={18} />
                    Download Postman Collection
                </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>

                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                    {/* Auth Section */}
                    <section>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            <Shield size={24} color="var(--accent)" />
                            Authentication
                        </h2>
                        <p style={{ color: 'var(--text-sub)', lineHeight: '1.6' }}>
                            Your API requests must be authenticated using a <strong>Bearer Token</strong>. You can generate a <strong>Scoped API Token</strong> from the Dashboard. These tokens start with <code>xiw_</code>.
                        </p>
                        <div style={{ padding: '1rem', background: 'rgba(239, 69, 101, 0.1)', border: '1px solid rgba(239, 69, 101, 0.2)', borderRadius: '8px', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--error)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                <AlertTriangle size={18} /> Important
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)', margin: 0 }}>
                                API Tokens are <strong>scoped</strong>. They can only send messages from the WhatsApp Accounts they were explicitly assigned to during generation. They <strong>cannot</strong> create or delete accounts.
                            </p>
                        </div>
                        <CodeBlock title="Header Example">
                            Authorization: Bearer xiw_123abc...
                        </CodeBlock>
                    </section>

                    {/* Endpoints Section */}
                    <section>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            <Terminal size={24} color="var(--success)" />
                            Messaging Endpoints
                        </h2>
                        <p style={{ color: 'var(--text-sub)', marginBottom: '1.5rem' }}>
                            Replace <code>:id</code> with the ID of your WhatsApp Instance (e.g. <code>1</code>).
                        </p>

                        <Endpoint method="POST" url="/api/wa/send/text/:id" desc="Send a text message." />
                        <CodeBlock title="cURL Example">
                            {`curl --location '${baseUrl}/api/wa/send/text/1' \\
--header 'Content-Type: application/json' \\
--header 'Authorization: Bearer xiw_YOUR_TOKEN' \\
--data '{
    "to": "1234567890",
    "message": "Hello from your bot!"
}'`}
                        </CodeBlock>

                        <Endpoint method="POST" url="/api/wa/send/image/:id" desc="Send an image from a URL." />
                        <CodeBlock title="Payload">
                            {`{
  "to": "1234567890",
  "url": "https://example.com/image.png",
  "caption": "Optional caption"
}`}
                        </CodeBlock>

                        <Endpoint method="POST" url="/api/wa/send/video/:id" desc="Send a video (mp4)." />
                        <CodeBlock title="Payload">
                            {`{
  "to": "1234567890",
  "url": "https://example.com/video.mp4",
  "caption": "Check this video"
}`}
                        </CodeBlock>

                        <Endpoint method="POST" url="/api/wa/send/document/:id" desc="Send a document (pdf, docx, etc)." />
                        <CodeBlock title="Payload">
                            {`{
  "to": "1234567890",
  "url": "https://example.com/invoice.pdf",
  "filename": "invoice_123.pdf", 
  "caption": "Here is your invoice"
}`}
                        </CodeBlock>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '3rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            Instance Management
                        </h2>

                        <Endpoint method="POST" url="/api/wa/start/:id" desc="Start the WhatsApp session." />

                        <Endpoint method="GET" url="/api/wa/status" desc="Get status of all allowed instances (Admin: All, Agent: Assigned)." />
                        <CodeBlock title="Response (List)">
                            {`{
  "instances": [
    {
      "id": 1,
      "name": "Support Bot",
      "status": "connected",
      "qr": null,
      "user": { "name": "My Business", "id": "12345@s.whatsapp.net" }
    }
  ]
}`}
                        </CodeBlock>

                        <Endpoint method="GET" url="/api/wa/status/:id" desc="Get status of a specific instance." />
                        <CodeBlock title="Response (Single)">
                            {`{
  "status": "connected", 
  "qr": null,
  "user": { ... }
}`}
                        </CodeBlock>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '3rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            Token Management (Admin)
                        </h2>

                        <Endpoint method="POST" url="/api/tokens" desc="Generate a new Scoped API Token. (Admin Only)" />
                        <CodeBlock title="Payload">
                            {`{
  "name": "Production App",
  "userId": 2, // Agent ID to assign to
  "instanceIds": [1, 3] // Array of allowed Instance IDs
}`}
                        </CodeBlock>
                    </section>

                </div>

                {/* Quick Start / Side */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', height: 'fit-content', position: 'sticky', top: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Key size={20} /> Quick Start
                    </h3>
                    <ol style={{ paddingLeft: '1.2rem', color: 'var(--text-sub)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li>Go to <strong>Dashboard</strong>.</li>
                        <li>Scroll to <strong>API Tokens</strong>.</li>
                        <li>Select an User and Instances.</li>
                        <li>Generate & Copy the token.</li>
                        <li>Use the live URL below:</li>
                    </ol>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', wordBreak: 'break-all', marginTop: '0.5rem', color: 'var(--accent)' }}>
                        {baseUrl || 'Loading...'}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Documentation;
