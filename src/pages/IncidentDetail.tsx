import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import GraphView from '../components/GraphView';

function CausalChain({ steps }: { steps: any[] }) {
  return (
    <div className="causal-chain">
      {steps.map((step, i) => (
        <div key={i} className={`chain-step-item ${step.critical ? 'critical' : 'active'}`}
          style={{ animationDelay: `${i * 120}ms` }}>
          <div className="chain-step-indicator">
            <div className="chain-step-dot" />
            {i < steps.length - 1 && <div className="chain-step-line" />}
          </div>
          <div className="chain-step-content animate-in" style={{ animationDelay: `${i * 120}ms` }}>
            <div className="chain-step-label">{step.label}</div>
            <div className="chain-step-time">{step.time}</div>
            <div className="chain-step-system">{step.system}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SHAPEvidence({ evidence }: { evidence: any[] }) {
  const maxVal = Math.max(...evidence.map(e => Math.abs(e.value)));
  return (
    <div className="shap-bars">
      {evidence.map((ev, i) => (
        <div key={ev.feature} className="shap-bar-item animate-in" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="shap-bar-name">{ev.feature}</div>
          <div className="shap-bar-track">
            <div
              className={`shap-bar-fill ${ev.direction === 'negative' ? 'negative' : ''}`}
              style={{ width: `${(Math.abs(ev.value) / maxVal) * 100}%` }}
            />
          </div>
          <div className="shap-bar-value">{ev.value >= 0 ? '+' : ''}{ev.value.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}

export default function IncidentDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { incidents, graphData, updateIncidentStatus, executeAction } = useData();
  const incident = incidents.find(i => i.id === id);

  if (!incident) {
    return (
      <div>
        <button className="btn btn-ghost" onClick={() => nav('/incidents')}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-tertiary)' }}>
          Incident not found
        </div>
      </div>
    );
  }

  const StatusIcon = incident.status === 'open' ? AlertTriangle : incident.status === 'investigating' ? Shield : CheckCircle;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <button className="btn btn-ghost" onClick={() => nav(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {incident.status !== 'investigating' && incident.status !== 'resolved' && (
            <button className="btn btn-secondary" onClick={() => updateIncidentStatus(incident.id, 'investigating')}>
              Investigate
            </button>
          )}
          {incident.status !== 'resolved' && (
            <button className="btn btn-primary" onClick={() => updateIncidentStatus(incident.id, 'resolved')}>
              Resolve Incident
            </button>
          )}
          {incident.status === 'resolved' && (
            <button className="btn btn-secondary" onClick={() => updateIncidentStatus(incident.id, 'open')}>
              Reopen Incident
            </button>
          )}
        </div>
      </div>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-lg)',
            background: incident.risk_score >= 0.9 ? 'var(--accent)' : 'var(--ink-primary)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-2xl)', fontWeight: 900,
          }}>
            {(incident.risk_score * 100).toFixed(0)}
          </div>
          <div>
            <h1>{incident.intent_label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h1>
            <div className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
              <span className="mono">{incident.id}</span>
              <span>·</span>
              <span className={`badge badge-${incident.status === 'open' ? 'accent' : incident.status === 'investigating' ? 'high' : 'low'}`}>
                <StatusIcon size={10} style={{ marginRight: 4 }} /> {incident.status}
              </span>
              <span>·</span>
              <span>{new Date(incident.created_at).toLocaleString('en-GB')}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        {incident.entities_involved.map(e => (
          <span key={e} className="entity-tag" style={{ cursor: 'pointer' }} onClick={() => nav(`/entities/${e}`)}>{e}</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Causal Chain</div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)' }}>
              {incident.causal_chain.length} steps
            </span>
          </div>
          <CausalChain steps={incident.causal_chain} />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Knowledge Graph</div>
          </div>
          <GraphView nodes={graphData.nodes} edges={graphData.edges} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <div className="card-title">SHAP Feature Attribution</div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)' }}>
            Top contributing features to the risk score
          </span>
        </div>
        <SHAPEvidence evidence={incident.top_evidence} />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Recommended Actions</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {incident.recommended_actions.map((action, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)', fontSize: 'var(--text-base)',
            }}>
              <span>{action}</span>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 12px', fontSize: 'var(--text-xs)' }}
                onClick={() => executeAction(incident.id, action)}
              >
                Execute
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
