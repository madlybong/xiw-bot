import { useEffect } from 'react';
import { themeChange } from 'theme-change';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ isLoggedIn, onLogout }: { isLoggedIn: boolean, onLogout: () => void }) => {
    const location = useLocation();

    useEffect(() => {
        themeChange(false);
    }, []);

    if (!isLoggedIn) return null;

    return (
        <div className="navbar bg-base-100 shadow-sm mb-8 rounded-box">
            <div className="flex-1">
                <Link to="/" className="btn btn-ghost text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    XiW Bot
                </Link>
            </div>
            <div className="flex-none gap-2">
                <ul className="menu menu-horizontal px-1 gap-2 hidden md:flex">
                    <li><Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link></li>
                    <li><Link to="/docs" className={location.pathname === '/docs' ? 'active' : ''}>API Docs</Link></li>
                </ul>

                {/* Theme Controller */}
                <label className="swap swap-rotate btn btn-ghost btn-circle">
                    {/* this hidden checkbox controls the state */}
                    <input type="checkbox" data-toggle-theme="dark,light" data-act-class="ACTIVECLASS" />

                    {/* sun icon */}
                    <Sun className="swap-on fill-current w-6 h-6" />

                    {/* moon icon */}
                    <Moon className="swap-off fill-current w-6 h-6" />
                </label>

                {/* Mobile Menu */}
                <div className="dropdown dropdown-end md:hidden">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                        <Menu size={24} />
                    </div>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                        <li><Link to="/dashboard">Dashboard</Link></li>
                        <li><Link to="/contacts">Address Book</Link></li>
                        <li><Link to="/logs">Audit Logs</Link></li>
                        <li><Link to="/docs">API Docs</Link></li>
                        <li><a onClick={onLogout}>Logout</a></li>
                    </ul>
                </div>

                <div className="hidden md:block">
                    <button className="btn btn-ghost btn-circle" onClick={onLogout} title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
