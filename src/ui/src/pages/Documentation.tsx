import React from 'react';
import { Download, ArrowLeft, Copy, Terminal, Shield, Key, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Documentation = () => {
    const navigate = useNavigate();

    const CodeBlock = ({ children }: { children: React.ReactNode }) => (
        <pre style={{
            background: '#16161a',
            padding: '1rem',
            borderRadius: '8px',
            overflowX: 'auto',
            border: '1px solid rgba(255,255,255,0.1)',
            marginTop: '0.5rem',
            marginBottom: '1rem'
        }}>
            <code style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#a8b1ff' }}>
                {children}
            </code>
        </pre>
    );

    const Endpoint = ({ method, url, desc }: { method: string, url: string, desc: string }) => (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{
                    fontWeight: 'bold',
                    color: method === 'GET' ? 'var(--success)' : method === 'POST' ? 'var(--accent)' : 'var(--error)',
                    background: method === 'GET' ? 'rgba(44, 182, 125, 0.1)' : method === 'POST' ? 'rgba(127, 90, 240, 0.1)' : 'rgba(239, 69, 101, 0.1)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                }}>{method}</span>
                <code style={{ fontSize: '0.9rem' }}>{url}</code>
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
                            All API requests must be authenticated using a <strong>Bearer Token</strong>. You can obtain a token via the Login endpoint (for admins) or generate a long-lived <strong>API Token</strong> from the Dashboard.
                        </p>
                        <CodeBlock>
                            Authorization: Bearer &lt;YOUR_TOKEN&gt;
                        </CodeBlock>
                    </section>

                    {/* Endpoints Section */}
                    <section>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            <Terminal size={24} color="var(--success)" />
                            Core Endpoints
                        </h2>

                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>WhatsApp</h3>
                        <Endpoint method="POST" url="/api/wa/start/:id" desc="Start the WhatsApp session for a specific account ID." />
                        <Endpoint method="GET" url="/api/wa/status/:id" desc="Get connection status and QR code (if connecting)." />
                        <CodeBlock>
                            {`// Response Example
{
  "status": "connecting",
  "qr": "2@gK8..." // Use a QR library to render this
}`}
                        </CodeBlock>
                        <Endpoint method="POST" url="/api/wa/logout/:id" desc="Logout and clear session data." />

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Accounts</h3>
                        <Endpoint method="GET" url="/api/accounts" desc="List all bot accounts." />
                        <Endpoint method="POST" url="/api/accounts" desc="Create a new bot account." />
                        <CodeBlock>
                            {`// Payload
{
  "name": "My Bot",
  "config": "{}"
}`}
                        </CodeBlock>

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Messaging</h3>

                        <Endpoint method="POST" url="/api/wa/send/text/:id" desc="Send a text message." />
                        <CodeBlock>
                            {`// Payload
{
  "to": "1234567890", // Phone number with country code (no +)
  "message": "Hello from XiW Bot!"
}`}
                        </CodeBlock>

                        <Endpoint method="POST" url="/api/wa/send/image/:id" desc="Send an image from a URL." />
                        <CodeBlock>
                            {`// Payload
{
  "to": "1234567890",
  "url": "https://example.com/image.png",
  "caption": "Check this out!"
}`}
                        </CodeBlock>

                        <Endpoint method="POST" url="/api/wa/send/video/:id" desc="Send a video from a URL." />
                        <CodeBlock>
                            {`// Payload
{
  "to": "1234567890",
  "url": "https://example.com/video.mp4",
  "caption": "Watch this"
}`}
                        </CodeBlock>

                        <Endpoint method="POST" url="/api/wa/send/document/:id" desc="Send a document/file." />
                        <CodeBlock>
                            {`// Payload
{
  "to": "1234567890",
  "url": "https://example.com/file.pdf",
  "filename": "invoice.pdf"
}`}
                        </CodeBlock>

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Tokens</h3>
                        <Endpoint method="POST" url="/api/tokens" desc="Generate a new API token." />
                        <CodeBlock>
                            {`// Payload
{
  "name": "Integration Name"
}`}
                        </CodeBlock>
                    </section>

                </div>

                {/* Quick Start / Side */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Key size={20} /> Quick Start
                    </h3>
                    <ol style={{ paddingLeft: '1.2rem', color: 'var(--text-sub)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li>Go to <strong>Dashboard</strong>.</li>
                        <li>Scroll to <strong>API Tokens</strong>.</li>
                        <li>Generate a new token.</li>
                        <li>Copy the token immediately.</li>
                        <li>Use it in your Authorization header.</li>
                    </ol>
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)' }}>
                            Need to test? Download the Postman Collection and import it.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Documentation;
