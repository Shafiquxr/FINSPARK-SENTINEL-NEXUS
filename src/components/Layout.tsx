import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Users, MessageSquare, AlertTriangle } from 'lucide-react';
import { useClock } from '../hooks/useSimulation';
import { useData } from '../context/DataContext';

const MenuVerticalIcon = () => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round"
    style={{ display: 'block' }}
  >
    <line x1="6" y1="4" x2="6" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
    <line x1="18" y1="4" x2="18" y2="20" />
  </svg>
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const clock = useClock();
  const { incidents } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openCritical = incidents.filter(i => i.status === 'open' && i.risk_score >= 0.9).length;
  const openCount = incidents.filter(i => i.status === 'open').length;

  const navItems = [
    { to: '/', icon: Activity, label: 'Live Feed', count: openCount },
    { to: '/entities', icon: Users, label: 'Entities', count: 0 },
    { to: '/copilot', icon: MessageSquare, label: 'AI Copilot', count: 0 },
  ];

  const handleLinkClick = () => {
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h1>Sentinel Nexus</h1>
          <span>Context Intelligence</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
              onClick={handleLinkClick}
              end={item.to === '/'}
            >
              <item.icon />
              <span>{item.label}</span>
              {item.count > 0 && <span className="badge-count">{item.count}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-status">
            <div className="status-dot" />
            <span>All systems operational</span>
          </div>
        </div>
      </aside>

      <div className={`app-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="sidebar-toggle" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              style={{ marginRight: 'var(--space-2)' }}
            >
              <MenuVerticalIcon />
            </button>
            {openCritical > 0 && (
              <div className="topbar-live">
                <div className="live-dot" />
                <span>{openCritical} Critical</span>
              </div>
            )}
          </div>
          <div className="topbar-right">
            <div className="topbar-live" style={{ color: 'var(--ink-secondary)' }}>
              <AlertTriangle size={14} />
              <span>{incidents.filter(i => i.status !== 'resolved').length} Active</span>
            </div>
            <div className="topbar-clock">
              {clock.toLocaleTimeString('en-GB')} UTC
            </div>
          </div>
        </header>
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}

