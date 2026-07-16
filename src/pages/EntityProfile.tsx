import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useData } from '../context/DataContext';

export default function EntityProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { entities, incidents } = useData();
  const entity = entities.find(e => e.id === id);

  if (!entity) {
    return (
      <div>
        <button className="btn btn-ghost" onClick={() => nav('/entities')}><ArrowLeft size={16} /> Back</button>
        <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-tertiary)' }}>Entity not found</div>
      </div>
    );
  }

  const relatedIncidents = (incidents || []).filter(i => (i.entities_involved || []).includes(entity.id));
  const initials = (entity.name || '').split(' ').filter(Boolean).map(n => n[0]).join('');
  const trendData = (entity.risk_trend || []).map((v, i) => ({ day: `D-${(entity.risk_trend || []).length - i}`, score: v }));

  return (
    <div>
      <button className="btn btn-ghost" onClick={() => nav(-1)} style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="entity-header animate-in">
        <div className="entity-avatar">{initials}</div>
        <div className="entity-info">
          <div className="entity-name">{entity.name}</div>
          <div className="entity-id">{entity.id}</div>
          <div className="entity-meta-grid">
            <div className="entity-meta-item">
              <span className="entity-meta-label">Type</span>
              <span className="entity-meta-value" style={{ textTransform: 'capitalize' }}>{entity.type}</span>
            </div>
            {entity.role && (
              <div className="entity-meta-item">
                <span className="entity-meta-label">Role</span>
                <span className="entity-meta-value">{entity.role}</span>
              </div>
            )}
            {entity.branch && (
              <div className="entity-meta-item">
                <span className="entity-meta-label">Branch</span>
                <span className="entity-meta-value">{entity.branch}</span>
              </div>
            )}
            {entity.department && (
              <div className="entity-meta-item">
                <span className="entity-meta-label">Department</span>
                <span className="entity-meta-value">{entity.department}</span>
              </div>
            )}
            {entity.access_level && (
              <div className="entity-meta-item">
                <span className="entity-meta-label">Access Level</span>
                <span className="entity-meta-value" style={{ color: entity.access_level.includes('escalated') ? 'var(--accent)' : 'inherit' }}>
                  {entity.access_level}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="entity-risk-display">
          <div className="entity-risk-score" style={{ color: (entity.risk_score || 0) >= 0.8 ? 'var(--accent)' : 'var(--ink-primary)' }}>
            {((entity.risk_score || 0) * 100).toFixed(0)}
          </div>
          <div className="entity-risk-label">Risk Score</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        <div className="card animate-in stagger-1">
          <div className="card-header">
            <div className="card-title">Risk Score Trend</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, color: '#ffffff', fontSize: 12 }}
                labelStyle={{ color: '#64748b' }}
              />
              <Line type="monotone" dataKey="score" stroke={(entity.risk_score || 0) >= 0.8 ? '#ef4444' : '#0f172a'}
                strokeWidth={2} dot={{ r: 3, fill: '#0f172a' }} activeDot={{ r: 5, fill: '#ef4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card animate-in stagger-2">
          <div className="card-header">
            <div className="card-title">Related Incidents</div>
            <span className="badge badge-medium">{relatedIncidents.length}</span>
          </div>
          {relatedIncidents.length === 0 ? (
            <div style={{ color: 'var(--ink-tertiary)', fontSize: 'var(--text-sm)', padding: 'var(--space-4) 0' }}>
              No incidents linked to this entity
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {relatedIncidents.map(inc => (
                <div key={inc.id} onClick={() => nav(`/incidents/${inc.id}`)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: 'var(--space-3)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', transition: 'all 150ms',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--ink-primary)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--line)'; }}
                >
                  <div>
                    <span className="mono" style={{ fontWeight: 500, marginRight: 'var(--space-2)' }}>{inc.id}</span>
                    <span style={{ textTransform: 'capitalize' }}>{inc.intent_label.replace(/_/g, ' ')}</span>
                  </div>
                  <span style={{ fontWeight: 800 }}>{(inc.risk_score * 100).toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card animate-in stagger-3">
        <div className="card-header">
          <div className="card-title">Behavioral DNA</div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)' }}>
            Current value vs. rolling baseline
          </span>
        </div>
        <div className="dna-grid">
          {(entity.features || []).map((feat, i) => (
            <div key={feat.name} className="dna-feature animate-in" style={{ animationDelay: `${(i + 4) * 60}ms` }}>
              <div className="dna-feature-header">
                <div className="dna-feature-name">{feat.name}</div>
                <div className="dna-feature-value" style={{ color: (feat.deviation || 0) >= 0.8 ? 'var(--accent)' : 'var(--ink-primary)' }}>
                  {typeof feat.value === 'number' && feat.value % 1 !== 0 ? feat.value.toFixed(2) : feat.value}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)', marginBottom: 'var(--space-1)' }}>
                <span>Baseline: {feat.baseline}</span>
                <span>Deviation: {((feat.deviation || 0) * 100).toFixed(0)}%</span>
              </div>
              <div className="dna-deviation-bar">
                <div className={`dna-deviation-fill${(feat.deviation || 0) >= 0.8 ? ' high' : ''}`}
                  style={{ width: `${(feat.deviation || 0) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
