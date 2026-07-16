import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';

function MetricCard({ label, value, delta, deltaDir, critical, sparkData }: {
  label: string; value: string | number; delta?: string; deltaDir?: 'up' | 'down';
  critical?: boolean; sparkData?: number[];
}) {
  return (
    <div className={`metric-card animate-in${critical ? ' critical' : ''}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {delta && (
        <div className={`metric-delta ${deltaDir}`}>
          <TrendingUp size={12} style={{ transform: deltaDir === 'down' ? 'scaleY(-1)' : 'none' }} />
          <span>{delta}</span>
        </div>
      )}
      {sparkData && (
        <div className="metric-sparkline">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData.map((v, i) => ({ v, i }))}>
              <Line type="monotone" dataKey="v" stroke="#000" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function IncidentCard({ incident, style }: { incident: any; style?: React.CSSProperties }) {
  const nav = useNavigate();
  const severityClass = incident.risk_score >= 0.9 ? 'critical' : '';
  const statusClass = incident.status === 'open' ? 'open' : '';
  return (
    <div
      className={`incident-card ${severityClass} ${statusClass}`}
      onClick={() => nav(`/incidents/${incident.id}`)}
      style={style}
    >
      <div className="incident-score">
        <div className="incident-score-value">{(incident.risk_score * 100).toFixed(0)}</div>
        <div className="incident-score-label">Risk</div>
      </div>
      <div className="incident-body">
        <div className="incident-title">{incident.intent_label.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</div>
        <div className="incident-meta">
          <span className="mono">{incident.id}</span>
          <span>·</span>
          <span className={`badge badge-${incident.status === 'open' ? 'accent' : incident.status === 'investigating' ? 'high' : 'low'}`}>
            {incident.status}
          </span>
          <span>·</span>
          <span>{new Date(incident.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} UTC</span>
        </div>
        <div className="incident-chain-preview">
          {incident.causal_chain.slice(0, 3).map((step: any, i: number) => (
            <span key={i} className="chain-step">
              {i > 0 && <ArrowRight size={10} className="chain-arrow" />}
              <span>{step.label.length > 30 ? step.label.slice(0, 28) + '…' : step.label}</span>
            </span>
          ))}
          {incident.causal_chain.length > 3 && <span>+{incident.causal_chain.length - 3} more</span>}
        </div>
        <div className="incident-entities">
          {incident.entities_involved.map((e: string) => (
            <span key={e} className="entity-tag">{e}</span>
          ))}
        </div>
      </div>
      <ChevronRight size={18} style={{ color: 'var(--ink-tertiary)', alignSelf: 'center' }} />
    </div>
  );
}

function EventRow({ event }: { event: { time: string; type: string; text: string; severity: string } }) {
  return (
    <div className="animate-in" style={{
      display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-2) 0',
      borderBottom: '1px solid var(--line)', fontSize: 'var(--text-sm)',
      alignItems: 'flex-start',
    }}>
      <span className="mono" style={{ color: 'var(--ink-tertiary)', minWidth: 72, flexShrink: 0 }}>{event.time}</span>
      <span className="badge" style={{
        background: event.severity === 'critical' ? 'var(--accent)' : event.severity === 'high' ? 'var(--ink-primary)' : 'var(--surface-raised)',
        color: event.severity === 'critical' || event.severity === 'high' ? '#fff' : 'var(--ink-secondary)',
        border: event.severity === 'low' || event.severity === 'medium' ? '1px solid var(--line)' : 'none',
        minWidth: 52, textAlign: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{event.type}</span>
      <span style={{ color: event.severity === 'critical' ? 'var(--accent)' : 'var(--ink-primary)', fontWeight: event.severity === 'critical' ? 600 : 400 }}>{event.text}</span>
    </div>
  );
}

export default function Dashboard() {
  const { incidents, metrics, events, isLive, setIsLive } = useData();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Command Center</h1>
          <div className="subtitle">Real-time cross-domain threat intelligence</div>
        </div>
        <button className={`btn ${isLive ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsLive(!isLive)}>
          <div className="live-dot" style={{ width: 6, height: 6, background: isLive ? '#4ADE80' : 'var(--ink-tertiary)' }} />
          {isLive ? 'Live' : 'Paused'}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <MetricCard label="Active Incidents" value={metrics.activeIncidents} delta="+2 today" deltaDir="up" critical
          sparkData={[1, 2, 1, 3, 2, 4, 3, 4]} />
        <MetricCard label="Critical Entities" value={metrics.criticalEntities} delta="+3 this hour" deltaDir="up"
          sparkData={[2, 3, 4, 3, 5, 4, 6, 7]} />
        <MetricCard label="Events Processed" value={metrics.eventsProcessed.toLocaleString()} delta="~52K/day" deltaDir="up"
          sparkData={[30, 35, 42, 38, 45, 48, 52, 48]} />
        <MetricCard label="Avg Response" value={`${metrics.avgResponseTime}s`} delta="< 1.2s target" deltaDir="down"
          sparkData={[1.4, 1.2, 1.1, 0.9, 1.0, 0.95, 0.94]} />
      </div>

      <div className="dashboard-grid">
        <div className="card animate-in" style={{ display: 'flex', flexDirection: 'column', height: '640px', padding: 'var(--space-5) 0 var(--space-5) var(--space-5)' }}>
          <div className="card-header" style={{ paddingRight: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
            <div className="card-title">Active Incidents</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {incidents.filter(i => i.status !== 'resolved').length === 0 ? (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--ink-tertiary)', fontSize: 'var(--text-sm)', height: '100%' }}>
                No active threats detected.
              </div>
            ) : (
              incidents.filter(i => i.status !== 'resolved').map((inc, i) => (
                <IncidentCard key={inc.id} incident={inc} style={{ animationDelay: `${i * 80}ms` }} />
              ))
            )}
          </div>
        </div>

        <div className="card animate-in stagger-1" style={{ display: 'flex', flexDirection: 'column', height: '640px', padding: 'var(--space-5) 0 var(--space-5) var(--space-5)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
            <div className="card-title">Event Stream</div>
            <div className="topbar-live" style={{ fontSize: 'var(--text-xs)' }}>
              <div className="live-dot" style={{ width: 6, height: 6 }} />
              <span>Live</span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 'var(--space-5)' }}>
            {events.length === 0 ? (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--ink-tertiary)', fontSize: 'var(--text-sm)', height: '100%' }}>
                Awaiting events...
              </div>
            ) : (
              events.map((ev, i) => (
                <EventRow key={`${ev.time}-${i}`} event={ev} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

