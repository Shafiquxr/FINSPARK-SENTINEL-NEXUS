import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';

export default function Entities() {
  const nav = useNavigate();
  const { entities } = useData();
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Entities</h1>
          <div className="subtitle">Monitored employees, customers, devices, and accounts</div>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Role / Branch</th>
            <th>Risk</th>
            <th>Trend</th>
            <th>Last Activity</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(entities || []).map(entity => (
            <tr key={entity.id} onClick={() => nav(`/entities/${entity.id}`)} style={{ cursor: 'pointer' }}>
              <td><span className="mono" style={{ fontWeight: 500 }}>{entity.id}</span></td>
              <td style={{ fontWeight: 500 }}>{entity.name}</td>
              <td>
                <span className="badge badge-medium" style={{ textTransform: 'capitalize' }}>{entity.type}</span>
              </td>
              <td style={{ color: 'var(--ink-secondary)' }}>{entity.role}{entity.branch ? ` · ${entity.branch}` : ''}</td>
              <td>
                <span style={{
                  fontWeight: 800, fontSize: 'var(--text-lg)',
                  color: (entity.risk_score || 0) >= 0.8 ? 'var(--accent)' : (entity.risk_score || 0) >= 0.5 ? 'var(--ink-primary)' : 'var(--ink-secondary)',
                }}>
                  {((entity.risk_score || 0) * 100).toFixed(0)}
                </span>
              </td>
              <td style={{ width: 100 }}>
                <ResponsiveContainer width={80} height={28}>
                  <LineChart data={(entity.risk_trend || []).map((v, i) => ({ v, i }))}>
                    <Line type="monotone" dataKey="v" stroke={(entity.risk_score || 0) >= 0.8 ? '#D62828' : '#000'} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </td>
              <td style={{ color: 'var(--ink-tertiary)', fontSize: 'var(--text-xs)' }}>
                {entity.last_activity ? new Date(entity.last_activity).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'} UTC
              </td>
              <td><ChevronRight size={16} style={{ color: 'var(--ink-tertiary)' }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
