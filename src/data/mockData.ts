// Sentinel Nexus — Mock Data

export interface Incident {
  id: string;
  risk_score: number;
  intent_label: string;
  status: 'open' | 'investigating' | 'resolved';
  entities_involved: string[];
  causal_chain: ChainStep[];
  top_evidence: Evidence[];
  recommended_actions: string[];
  created_at: string;
}

export interface ChainStep {
  label: string;
  time: string;
  system: string;
  critical?: boolean;
}

export interface Evidence {
  feature: string;
  value: number;
  direction: 'positive' | 'negative';
}

export interface Entity {
  id: string;
  type: 'employee' | 'customer' | 'device' | 'account';
  name: string;
  role?: string;
  branch?: string;
  risk_score: number;
  risk_trend: number[];
  features: FeatureValue[];
  department?: string;
  access_level?: string;
  last_activity: string;
}

export interface FeatureValue {
  name: string;
  value: number;
  baseline: number;
  deviation: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  risk?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  timestamp?: string;
}

export const incidents: Incident[] = [
  {
    id: 'INC-0420',
    risk_score: 0.95,
    intent_label: 'quantum_harvest',
    status: 'open',
    entities_involved: ['EMP-0087', 'DEV-0311', 'DB-CORE-SECURE', 'IP-198.51.100.42'],
    causal_chain: [
      { label: 'TLS cipher suite downgrade attack detected (non-PQC curves negotiated)', time: '11:02:14 UTC', system: 'Edge Gateway' },
      { label: 'Bulk SSL session key export anomaly', time: '11:03:01 UTC', system: 'HSM / Key Store' },
      { label: 'Anomalous off-hours read queries on encrypted db archives', time: '11:05:40 UTC', system: 'Database Monitor' },
      { label: 'Data egress: 240 GB exfiltrated via unauthorized channel', time: '11:08:12 UTC', system: 'DLP / Network Flow', critical: true },
      { label: 'Target IP identified as active Harvest-Now-Decrypt-Later collection node', time: '11:09:44 UTC', system: 'Threat Intel / IP Reputation', critical: true },
    ],
    top_evidence: [
      { feature: 'tls_pqc_downgrade', value: 0.95, direction: 'positive' },
      { feature: 'exfiltration_volume_zscore', value: 0.89, direction: 'positive' },
      { feature: 'ip_reputation_score', value: 0.82, direction: 'positive' },
      { feature: 'hsm_key_export_anomaly', value: 0.74, direction: 'positive' },
      { feature: 'query_entropy', value: 0.65, direction: 'positive' },
    ],
    recommended_actions: [
      'Enforce Post-Quantum Cryptography (ML-KEM/Kyber) on Edge Gateway',
      'Revoke compromised session tickets and rotate HSM master secret key',
      'Quarantine source host DEV-0311',
      'Deploy post-quantum risk monitoring alerts for all TLS handshakes',
    ],
    created_at: '2026-07-16T11:09:45Z',
  },
  {
    id: 'INC-0417',
    risk_score: 0.98,
    intent_label: 'insider_fraud',
    status: 'open',
    entities_involved: ['EMP-0231', 'DEV-1042', 'ACC-58831', 'BEN-9910'],
    causal_chain: [
      { label: 'VPN login from new location (Mumbai → Kolkata)', time: '08:12:04 UTC', system: 'VPN / Network' },
      { label: 'New device registered, trust score 0.1', time: '08:12:18 UTC', system: 'EDR' },
      { label: 'Privilege escalation: teller → approver', time: '08:14:55 UTC', system: 'IAM / PAM' },
      { label: 'Dormant account ACC-58831 accessed', time: '08:22:31 UTC', system: 'Core Banking' },
      { label: 'New beneficiary BEN-9910 added', time: '08:24:07 UTC', system: 'Core Banking', critical: true },
      { label: 'RTGS transfer initiated: ₹9,40,000', time: '08:25:42 UTC', system: 'RTGS Gateway', critical: true },
    ],
    top_evidence: [
      { feature: 'device_novelty', value: 1.0, direction: 'positive' },
      { feature: 'privilege_delta', value: 0.92, direction: 'positive' },
      { feature: 'beneficiary_age_at_txn', value: 0.88, direction: 'positive' },
      { feature: 'geo_novelty', value: 0.85, direction: 'positive' },
      { feature: 'dormant_account_touch', value: 0.79, direction: 'positive' },
      { feature: 'txn_amount_zscore', value: 0.74, direction: 'positive' },
      { feature: 'login_hour_deviation', value: 0.31, direction: 'positive' },
      { feature: 'graph_betweenness', value: -0.12, direction: 'negative' },
    ],
    recommended_actions: ['Freeze account ACC-58831', 'Revoke elevated privilege for EMP-0231', 'Require step-up auth', 'Notify SOC + branch manager'],
    created_at: '2026-07-16T08:25:44Z',
  },
  {
    id: 'INC-0416',
    risk_score: 0.91,
    intent_label: 'account_takeover',
    status: 'investigating',
    entities_involved: ['CUST-4412', 'DEV-2088', 'ACC-44120'],
    causal_chain: [
      { label: 'Credential-stuffing pattern detected (12 failed logins)', time: '06:41:00 UTC', system: 'Auth Gateway' },
      { label: 'Password reset via SMS OTP', time: '06:44:22 UTC', system: 'IAM' },
      { label: 'New device DEV-2088 registered', time: '06:45:01 UTC', system: 'EDR' },
      { label: 'Rapid UPI transfers: 3 × ₹49,900', time: '06:48:15 UTC', system: 'UPI Gateway', critical: true },
    ],
    top_evidence: [
      { feature: 'velocity_1h', value: 0.95, direction: 'positive' },
      { feature: 'device_novelty', value: 0.90, direction: 'positive' },
      { feature: 'channel_novelty', value: 0.72, direction: 'positive' },
      { feature: 'txn_amount_zscore', value: 0.68, direction: 'positive' },
    ],
    recommended_actions: ['Freeze account ACC-44120', 'Force password reset', 'Block device DEV-2088'],
    created_at: '2026-07-16T06:48:20Z',
  },
  {
    id: 'INC-0415',
    risk_score: 0.84,
    intent_label: 'data_exfiltration',
    status: 'investigating',
    entities_involved: ['EMP-0087', 'DEV-0311'],
    causal_chain: [
      { label: 'Off-hours DB query volume spike (3.2× baseline)', time: '23:14:00 UTC', system: 'Database Monitor' },
      { label: 'Large export action: 14,200 records', time: '23:22:45 UTC', system: 'Data Loss Prevention' },
      { label: 'No matching business ticket or approval', time: '—', system: 'Ticketing System' },
    ],
    top_evidence: [
      { feature: 'login_hour_deviation', value: 0.94, direction: 'positive' },
      { feature: 'query_volume_zscore', value: 0.88, direction: 'positive' },
      { feature: 'export_size_anomaly', value: 0.82, direction: 'positive' },
    ],
    recommended_actions: ['Revoke DB access for EMP-0087', 'Quarantine exported data', 'Escalate to CISO'],
    created_at: '2026-07-15T23:23:00Z',
  },
  {
    id: 'INC-0414',
    risk_score: 0.77,
    intent_label: 'money_laundering',
    status: 'open',
    entities_involved: ['ACC-12340', 'ACC-12341', 'ACC-12342', 'BEN-8801'],
    causal_chain: [
      { label: 'Multiple small inbound credits (8 × ₹9,500)', time: '10:00–12:30 UTC', system: 'Core Banking' },
      { label: 'Same-day outbound to new beneficiary BEN-8801', time: '13:15:22 UTC', system: 'NEFT Gateway', critical: true },
      { label: 'Pattern repeated across 3 linked accounts', time: '10:00–14:00 UTC', system: 'Core Banking' },
    ],
    top_evidence: [
      { feature: 'velocity_24h', value: 0.87, direction: 'positive' },
      { feature: 'beneficiary_age_at_txn', value: 0.81, direction: 'positive' },
      { feature: 'structuring_pattern', value: 0.76, direction: 'positive' },
    ],
    recommended_actions: ['File STR with FIU', 'Freeze accounts ACC-1234*', 'Enhanced due diligence on BEN-8801'],
    created_at: '2026-07-16T14:00:05Z',
  },
  {
    id: 'INC-0413',
    risk_score: 0.45,
    intent_label: 'benign_anomaly',
    status: 'resolved',
    entities_involved: ['EMP-0155'],
    causal_chain: [
      { label: 'Privilege escalation used (ops → admin)', time: '14:30:00 UTC', system: 'IAM / PAM' },
      { label: 'No downstream transaction or data access', time: '—', system: 'Audit Log' },
    ],
    top_evidence: [
      { feature: 'privilege_delta', value: 0.62, direction: 'positive' },
      { feature: 'txn_amount_zscore', value: -0.05, direction: 'negative' },
    ],
    recommended_actions: ['Log for audit review', 'No immediate action required'],
    created_at: '2026-07-15T14:30:10Z',
  },
];

export const entities: Entity[] = [
  {
    id: 'EMP-0231', type: 'employee', name: 'Rajesh Mehta', role: 'Teller', branch: 'Mumbai Central',
    risk_score: 0.96, department: 'Retail Banking', access_level: 'Approver (escalated)',
    risk_trend: [0.12, 0.14, 0.11, 0.15, 0.13, 0.18, 0.22, 0.45, 0.78, 0.92, 0.96],
    last_activity: '2026-07-16T08:25:42Z',
    features: [
      { name: 'login_hour_deviation', value: 2.8, baseline: 0.3, deviation: 0.82 },
      { name: 'device_novelty', value: 1.0, baseline: 0.0, deviation: 1.0 },
      { name: 'geo_novelty', value: 1.0, baseline: 0.0, deviation: 1.0 },
      { name: 'privilege_delta', value: 2.0, baseline: 0.0, deviation: 0.92 },
      { name: 'dormant_account_touch_count', value: 1.0, baseline: 0.02, deviation: 0.79 },
      { name: 'beneficiary_add_velocity', value: 3.2, baseline: 0.1, deviation: 0.88 },
      { name: 'graph_betweenness', value: 0.34, baseline: 0.28, deviation: 0.15 },
    ],
  },
  {
    id: 'EMP-0087', type: 'employee', name: 'Priya Sharma', role: 'IT Admin', branch: 'HQ Delhi',
    risk_score: 0.84, department: 'IT Operations', access_level: 'Admin',
    risk_trend: [0.08, 0.09, 0.07, 0.10, 0.09, 0.11, 0.15, 0.42, 0.71, 0.84],
    last_activity: '2026-07-15T23:22:45Z',
    features: [
      { name: 'login_hour_deviation', value: 4.1, baseline: 0.2, deviation: 0.94 },
      { name: 'device_novelty', value: 0.0, baseline: 0.0, deviation: 0.0 },
      { name: 'query_volume_zscore', value: 3.2, baseline: 0.5, deviation: 0.88 },
      { name: 'export_size_anomaly', value: 14200, baseline: 200, deviation: 0.82 },
    ],
  },
  {
    id: 'EMP-0155', type: 'employee', name: 'Vikram Singh', role: 'Operations Manager', branch: 'Pune',
    risk_score: 0.22, department: 'Operations', access_level: 'Ops',
    risk_trend: [0.10, 0.12, 0.09, 0.11, 0.10, 0.14, 0.22, 0.18, 0.15, 0.22],
    last_activity: '2026-07-15T14:30:00Z',
    features: [
      { name: 'login_hour_deviation', value: 0.1, baseline: 0.2, deviation: 0.05 },
      { name: 'privilege_delta', value: 1.0, baseline: 0.0, deviation: 0.62 },
    ],
  },
  {
    id: 'CUST-4412', type: 'customer', name: 'Ananya Gupta', branch: 'Bangalore East',
    risk_score: 0.88, role: 'Premium',
    risk_trend: [0.05, 0.04, 0.06, 0.05, 0.07, 0.12, 0.55, 0.82, 0.88],
    last_activity: '2026-07-16T06:48:15Z',
    features: [
      { name: 'velocity_1h', value: 3, baseline: 0.2, deviation: 0.95 },
      { name: 'txn_amount_zscore', value: 2.8, baseline: 0.3, deviation: 0.68 },
      { name: 'channel_novelty', value: 1.0, baseline: 0.1, deviation: 0.72 },
      { name: 'device_novelty', value: 1.0, baseline: 0.0, deviation: 0.90 },
    ],
  },
];

export const graphData = {
  nodes: [
    { id: 'EMP-0231', label: 'R. Mehta', type: 'Employee', risk: 0.96 },
    { id: 'DEV-1042', label: 'DEV-1042', type: 'Device', risk: 0.1 },
    { id: 'DEV-0445', label: 'DEV-0445', type: 'Device', risk: 0.85 },
    { id: 'ACC-58831', label: 'ACC-58831', type: 'Account', risk: 0.79 },
    { id: 'BEN-9910', label: 'BEN-9910', type: 'Beneficiary', risk: 0.88 },
    { id: 'CUST-5883', label: 'D. Patel', type: 'Customer', risk: 0.15 },
    { id: 'TXN-7741', label: '₹9.4L RTGS', type: 'Transaction', risk: 0.98 },
    { id: 'BR-MUM', label: 'Mumbai Central', type: 'Branch', risk: 0.0 },
    { id: 'EMP-0087', label: 'P. Sharma', type: 'Employee', risk: 0.84 },
    { id: 'DEV-0311', label: 'DEV-0311', type: 'Device', risk: 0.84 },
    { id: 'DB-CORE-SECURE', label: 'DB-CORE-SECURE', type: 'Database', risk: 0.88 },
    { id: 'IP-198.51.100.42', label: 'IP-198.51.100.42', type: 'IP', risk: 0.95 },
  ] as GraphNode[],
  edges: [
    { source: 'EMP-0231', target: 'DEV-1042', label: 'USES (new)' },
    { source: 'EMP-0231', target: 'DEV-0445', label: 'USES (usual)' },
    { source: 'EMP-0231', target: 'ACC-58831', label: 'ACCESSED' },
    { source: 'EMP-0231', target: 'BEN-9910', label: 'ADDED' },
    { source: 'EMP-0231', target: 'TXN-7741', label: 'APPROVED' },
    { source: 'ACC-58831', target: 'CUST-5883', label: 'OWNED_BY' },
    { source: 'TXN-7741', target: 'ACC-58831', label: 'DEBITS' },
    { source: 'TXN-7741', target: 'BEN-9910', label: 'CREDITS' },
    { source: 'EMP-0231', target: 'BR-MUM', label: 'BELONGS_TO' },
    { source: 'EMP-0087', target: 'DEV-0311', label: 'USES' },
    { source: 'DEV-0311', target: 'DB-CORE-SECURE', label: 'ACCESSED' },
    { source: 'DB-CORE-SECURE', target: 'IP-198.51.100.42', label: 'EXFILTRATED' },
  ] as GraphEdge[],
};

export const metrics = {
  activeIncidents: 5,
  criticalEntities: 8,
  eventsProcessed: 48230,
  avgResponseTime: 0.94,
  entitiesMonitored: 5650,
  modelsActive: 5,
};

export const recentEvents = [
  { time: '11:09:45', type: 'INCIDENT', text: 'INC-0420 created — quantum_harvest (0.95)', severity: 'critical' },
  { time: '11:08:12', type: 'EGRESS', text: '240 GB exfiltrated to IP-198.51.100.42 from DEV-0311', severity: 'critical' },
  { time: '11:05:40', type: 'ACCESS', text: 'EMP-0087 read 124,000 DB records off-hours', severity: 'high' },
  { time: '11:03:01', type: 'CRYPTO', text: 'Bulk SSL session key export from HSM by DEV-0311', severity: 'high' },
  { time: '11:02:14', type: 'CRYPTO', text: 'TLS version downgrade detected (non-PQC negotiated)', severity: 'medium' },
  { time: '08:25:44', type: 'INCIDENT', text: 'INC-0417 created — insider_fraud (0.98)', severity: 'critical' },
  { time: '08:25:42', type: 'TXN', text: 'RTGS ₹9,40,000 initiated by EMP-0231', severity: 'high' },
  { time: '08:24:07', type: 'BANKING', text: 'New beneficiary BEN-9910 added to ACC-58831', severity: 'medium' },
];

export const copilotSuggestions = [
  'Show me the full attack chain for INC-0420',
  'What are the indicators of the quantum harvest attack?',
  'Show me the full attack chain for INC-0417',
  'Which employees accessed dormant accounts this week?',
];
