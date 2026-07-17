import asyncio
import random
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Sentinel Nexus Backend", version="1.0.0")

# CORS middleware config to allow React dev server to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---

class ChainStep(BaseModel):
    label: str
    time: str
    system: str
    critical: Optional[bool] = False

class Evidence(BaseModel):
    feature: str
    value: float
    direction: str

class Incident(BaseModel):
    id: str
    risk_score: float
    intent_label: str
    status: str  # 'open' | 'investigating' | 'resolved'
    entities_involved: List[str]
    causal_chain: List[ChainStep]
    top_evidence: List[Evidence]
    recommended_actions: List[str]
    created_at: str

class FeatureValue(BaseModel):
    name: str
    value: float
    baseline: float
    deviation: float

class Entity(BaseModel):
    id: str
    type: str  # 'employee' | 'customer' | 'device' | 'account'
    name: str
    role: Optional[str] = None
    branch: Optional[str] = None
    risk_score: float
    risk_trend: List[float]
    features: List[FeatureValue]
    department: Optional[str] = None
    access_level: Optional[str] = None
    last_activity: str

class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    risk: Optional[float] = None

class GraphEdge(BaseModel):
    source: str
    target: str
    label: str
    timestamp: Optional[str] = None

class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class Metrics(BaseModel):
    activeIncidents: int
    criticalEntities: int
    eventsProcessed: int
    avgResponseTime: float
    entitiesMonitored: int
    modelsActive: int

class CopilotQuery(BaseModel):
    query: str

class CopilotResponse(BaseModel):
    content: str

# --- In-Memory Database ---

incidents_db: List[Incident] = [
    Incident(
        id='INC-0420',
        risk_score=0.95,
        intent_label='quantum_harvest',
        status='open',
        entities_involved=['EMP-0087', 'DEV-0311', 'DB-CORE-SECURE', 'IP-198.51.100.42'],
        causal_chain=[
            ChainStep(label='TLS cipher suite downgrade attack detected (non-PQC curves negotiated)', time='11:02:14 UTC', system='Edge Gateway'),
            ChainStep(label='Bulk SSL session key export anomaly', time='11:03:01 UTC', system='HSM / Key Store'),
            ChainStep(label='Anomalous off-hours read queries on encrypted db archives', time='11:05:40 UTC', system='Database Monitor'),
            ChainStep(label='Data egress: 240 GB exfiltrated via unauthorized channel', time='11:08:12 UTC', system='DLP / Network Flow', critical=True),
            ChainStep(label='Target IP identified as active Harvest-Now-Decrypt-Later collection node', time='11:09:44 UTC', system='Threat Intel / IP Reputation', critical=True),
        ],
        top_evidence=[
            Evidence(feature='tls_pqc_downgrade', value=0.95, direction='positive'),
            Evidence(feature='exfiltration_volume_zscore', value=0.89, direction='positive'),
            Evidence(feature='ip_reputation_score', value=0.82, direction='positive'),
            Evidence(feature='hsm_key_export_anomaly', value=0.74, direction='positive'),
            Evidence(feature='query_entropy', value=0.65, direction='positive'),
        ],
        recommended_actions=[
            'Enforce Post-Quantum Cryptography (ML-KEM/Kyber) on Edge Gateway',
            'Revoke compromised session tickets and rotate HSM master secret key',
            'Quarantine source host DEV-0311',
            'Deploy post-quantum risk monitoring alerts for all TLS handshakes',
        ],
        created_at='2026-07-16T11:09:45Z',
    ),
    Incident(
        id='INC-0417',
        risk_score=0.98,
        intent_label='insider_fraud',
        status='open',
        entities_involved=['EMP-0231', 'DEV-1042', 'ACC-58831', 'BEN-9910'],
        causal_chain=[
            ChainStep(label='VPN login from new location (Mumbai → Kolkata)', time='08:12:04 UTC', system='VPN / Network'),
            ChainStep(label='New device registered, trust score 0.1', time='08:12:18 UTC', system='EDR'),
            ChainStep(label='Privilege escalation: teller → approver', time='08:14:55 UTC', system='IAM / PAM'),
            ChainStep(label='Dormant account ACC-58831 accessed', time='08:22:31 UTC', system='Core Banking'),
            ChainStep(label='New beneficiary BEN-9910 added', time='08:24:07 UTC', system='Core Banking', critical=True),
            ChainStep(label='RTGS transfer initiated: ₹9,40,000', time='08:25:42 UTC', system='RTGS Gateway', critical=True),
        ],
        top_evidence=[
            Evidence(feature='device_novelty', value=1.0, direction='positive'),
            Evidence(feature='privilege_delta', value=0.92, direction='positive'),
            Evidence(feature='beneficiary_age_at_txn', value=0.88, direction='positive'),
            Evidence(feature='geo_novelty', value=0.85, direction='positive'),
            Evidence(feature='dormant_account_touch', value=0.79, direction='positive'),
            Evidence(feature='txn_amount_zscore', value=0.74, direction='positive'),
            Evidence(feature='login_hour_deviation', value=0.31, direction='positive'),
            Evidence(feature='graph_betweenness', value=-0.12, direction='negative'),
        ],
        recommended_actions=['Freeze account ACC-58831', 'Revoke elevated privilege for EMP-0231', 'Require step-up auth', 'Notify SOC + branch manager'],
        created_at='2026-07-16T08:25:44Z',
    ),
    Incident(
        id='INC-0416',
        risk_score=0.91,
        intent_label='account_takeover',
        status='investigating',
        entities_involved=['CUST-4412', 'DEV-2088', 'ACC-44120'],
        causal_chain=[
            ChainStep(label='Credential-stuffing pattern detected (12 failed logins)', time='06:41:00 UTC', system='Auth Gateway'),
            ChainStep(label='Password reset via SMS OTP', time='06:44:22 UTC', system='IAM'),
            ChainStep(label='New device DEV-2088 registered', time='06:45:01 UTC', system='EDR'),
            ChainStep(label='Rapid UPI transfers: 3 × ₹49,900', time='06:48:15 UTC', system='UPI Gateway', critical=True),
        ],
        top_evidence=[
            Evidence(feature='velocity_1h', value=0.95, direction='positive'),
            Evidence(feature='device_novelty', value=0.90, direction='positive'),
            Evidence(feature='channel_novelty', value=0.72, direction='positive'),
            Evidence(feature='txn_amount_zscore', value=0.68, direction='positive'),
        ],
        recommended_actions=['Freeze account ACC-44120', 'Force password reset', 'Block device DEV-2088'],
        created_at='2026-07-16T06:48:20Z',
    ),
    Incident(
        id='INC-0415',
        risk_score=0.84,
        intent_label='data_exfiltration',
        status='investigating',
        entities_involved=['EMP-0087', 'DEV-0311'],
        causal_chain=[
            ChainStep(label='Off-hours DB query volume spike (3.2× baseline)', time='23:14:00 UTC', system='Database Monitor'),
            ChainStep(label='Large export action: 14,200 records', time='23:22:45 UTC', system='Data Loss Prevention'),
            ChainStep(label='No matching business ticket or approval', time='—', system='Ticketing System'),
        ],
        top_evidence=[
            Evidence(feature='login_hour_deviation', value=0.94, direction='positive'),
            Evidence(feature='query_volume_zscore', value=0.88, direction='positive'),
            Evidence(feature='export_size_anomaly', value=0.82, direction='positive'),
        ],
        recommended_actions=['Revoke DB access for EMP-0087', 'Quarantine exported data', 'Escalate to CISO'],
        created_at='2026-07-15T23:23:00Z',
    ),
    Incident(
        id='INC-0414',
        risk_score=0.77,
        intent_label='money_laundering',
        status='open',
        entities_involved=['ACC-12340', 'ACC-12341', 'ACC-12342', 'BEN-8801'],
        causal_chain=[
            ChainStep(label='Multiple small inbound credits (8 × ₹9,500)', time='10:00–12:30 UTC', system='Core Banking'),
            ChainStep(label='Same-day outbound to new beneficiary BEN-8801', time='13:15:22 UTC', system='NEFT Gateway', critical=True),
            ChainStep(label='Pattern repeated across 3 linked accounts', time='10:00–14:00 UTC', system='Core Banking'),
        ],
        top_evidence=[
            Evidence(feature='velocity_24h', value=0.87, direction='positive'),
            Evidence(feature='beneficiary_age_at_txn', value=0.81, direction='positive'),
            Evidence(feature='structuring_pattern', value=0.76, direction='positive'),
        ],
        recommended_actions=['File STR with FIU', 'Freeze accounts ACC-1234*', 'Enhanced due diligence on BEN-8801'],
        created_at='2026-07-16T14:00:05Z',
    ),
    Incident(
        id='INC-0413',
        risk_score=0.45,
        intent_label='benign_anomaly',
        status='resolved',
        entities_involved=['EMP-0155'],
        causal_chain=[
            ChainStep(label='Privilege escalation used (ops → admin)', time='14:30:00 UTC', system='IAM / PAM'),
            ChainStep(label='No downstream transaction or data access', time='—', system='Audit Log'),
        ],
        top_evidence=[
            Evidence(feature='privilege_delta', value=0.62, direction='positive'),
            Evidence(feature='txn_amount_zscore', value=-0.05, direction='negative'),
        ],
        recommended_actions=['Log for audit review', 'No immediate action required'],
        created_at='2026-07-15T14:30:10Z',
    ),
]

entities_db: List[Entity] = [
    Entity(
        id='EMP-0231', type='employee', name='Rajesh Mehta', role='Teller', branch='Mumbai Central',
        risk_score=0.96, department='Retail Banking', access_level='Approver (escalated)',
        risk_trend=[0.12, 0.14, 0.11, 0.15, 0.13, 0.18, 0.22, 0.45, 0.78, 0.92, 0.96],
        last_activity='2026-07-16T08:25:42Z',
        features=[
            FeatureValue(name='login_hour_deviation', value=2.8, baseline=0.3, deviation=0.82),
            FeatureValue(name='device_novelty', value=1.0, baseline=0.0, deviation=1.0),
            FeatureValue(name='geo_novelty', value=1.0, baseline=0.0, deviation=1.0),
            FeatureValue(name='privilege_delta', value=2.0, baseline=0.0, deviation=0.92),
            FeatureValue(name='dormant_account_touch_count', value=1.0, baseline=0.02, deviation=0.79),
            FeatureValue(name='beneficiary_add_velocity', value=3.2, baseline=0.1, deviation=0.88),
            FeatureValue(name='graph_betweenness', value=0.34, baseline=0.28, deviation=0.15),
        ],
    ),
    Entity(
        id='EMP-0087', type='employee', name='Priya Sharma', role='IT Admin', branch='HQ Delhi',
        risk_score=0.84, department='IT Operations', access_level='Admin',
        risk_trend=[0.08, 0.09, 0.07, 0.10, 0.09, 0.11, 0.15, 0.42, 0.71, 0.84],
        last_activity='2026-07-15T23:22:45Z',
        features=[
            FeatureValue(name='login_hour_deviation', value=4.1, baseline=0.2, deviation=0.94),
            FeatureValue(name='device_novelty', value=0.0, baseline=0.0, deviation=0.0),
            FeatureValue(name='query_volume_zscore', value=3.2, baseline=0.5, deviation=0.88),
            FeatureValue(name='export_size_anomaly', value=14200.0, baseline=200.0, deviation=0.82),
        ],
    ),
    Entity(
        id='EMP-0155', type='employee', name='Vikram Singh', role='Operations Manager', branch='Pune',
        risk_score=0.22, department='Operations', access_level='Ops',
        risk_trend=[0.10, 0.12, 0.09, 0.11, 0.10, 0.14, 0.22, 0.18, 0.15, 0.22],
        last_activity='2026-07-15T14:30:00Z',
        features=[
            FeatureValue(name='login_hour_deviation', value=0.1, baseline=0.2, deviation=0.05),
            FeatureValue(name='privilege_delta', value=1.0, baseline=0.0, deviation=0.62),
        ],
    ),
    Entity(
        id='CUST-4412', type='customer', name='Ananya Gupta', branch='Bangalore East',
        risk_score=0.88, role='Premium',
        risk_trend=[0.05, 0.04, 0.06, 0.05, 0.07, 0.12, 0.55, 0.82, 0.88],
        last_activity='2026-07-16T06:48:15Z',
        features=[
            FeatureValue(name='velocity_1h', value=3.0, baseline=0.2, deviation=0.95),
            FeatureValue(name='txn_amount_zscore', value=2.8, baseline=0.3, deviation=0.68),
            FeatureValue(name='channel_novelty', value=1.0, baseline=0.1, deviation=0.72),
            FeatureValue(name='device_novelty', value=1.0, baseline=0.0, deviation=0.90),
        ],
    ),
]

graph_db = GraphData(
    nodes=[
        GraphNode(id='EMP-0231', label='R. Mehta', type='Employee', risk=0.96),
        GraphNode(id='DEV-1042', label='DEV-1042', type='Device', risk=0.1),
        GraphNode(id='DEV-0445', label='DEV-0445', type='Device', risk=0.85),
        GraphNode(id='ACC-58831', label='ACC-58831', type='Account', risk=0.79),
        GraphNode(id='BEN-9910', label='BEN-9910', type='Beneficiary', risk=0.88),
        GraphNode(id='CUST-5883', label='D. Patel', type='Customer', risk=0.15),
        GraphNode(id='TXN-7741', label='₹9.4L RTGS', type='Transaction', risk=0.98),
        GraphNode(id='BR-MUM', label='Mumbai Central', type='Branch', risk=0.0),
        GraphNode(id='EMP-0087', label='P. Sharma', type='Employee', risk=0.84),
        GraphNode(id='DEV-0311', label='DEV-0311', type='Device', risk=0.84),
        GraphNode(id='DB-CORE-SECURE', label='DB-CORE-SECURE', type='Database', risk=0.88),
        GraphNode(id='IP-198.51.100.42', label='IP-198.51.100.42', type='IP', risk=0.95),
    ],
    edges=[
        GraphEdge(source='EMP-0231', target='DEV-1042', label='USES (new)'),
        GraphEdge(source='EMP-0231', target='DEV-0445', label='USES (usual)'),
        GraphEdge(source='EMP-0231', target='ACC-58831', label='ACCESSED'),
        GraphEdge(source='EMP-0231', target='BEN-9910', label='ADDED'),
        GraphEdge(source='EMP-0231', target='TXN-7741', label='APPROVED'),
        GraphEdge(source='ACC-58831', target='CUST-5883', label='OWNED_BY'),
        GraphEdge(source='TXN-7741', target='ACC-58831', label='DEBITS'),
        GraphEdge(source='TXN-7741', target='BEN-9910', label='CREDITS'),
        GraphEdge(source='EMP-0231', target='BR-MUM', label='BELONGS_TO'),
        GraphEdge(source='EMP-0087', target='DEV-0311', label='USES'),
        GraphEdge(source='DEV-0311', target='DB-CORE-SECURE', label='ACCESSED'),
        GraphEdge(source='DB-CORE-SECURE', target='IP-198.51.100.42', label='EXFILTRATED'),
    ]
)

metrics_db = Metrics(
    activeIncidents=5,
    criticalEntities=8,
    eventsProcessed=48230,
    avgResponseTime=0.94,
    entitiesMonitored=5650,
    modelsActive=5,
)

recent_events_db = [
    {"time": "11:09:45", "type": "INCIDENT", "text": "INC-0420 created — quantum_harvest (0.95)", "severity": "critical"},
    {"time": "11:08:12", "type": "EGRESS", "text": "240 GB exfiltrated to IP-198.51.100.42 from DEV-0311", "severity": "critical"},
    {"time": "11:05:40", "type": "ACCESS", "text": "EMP-0087 read 124,000 DB records off-hours", "severity": "high"},
    {"time": "11:03:01", "type": "CRYPTO", "text": "Bulk SSL session key export from HSM by DEV-0311", "severity": "high"},
    {"time": "11:02:14", "type": "CRYPTO", "text": "TLS version downgrade detected (non-PQC negotiated)", "severity": "medium"},
    {"time": "08:25:44", "type": "INCIDENT", "text": "INC-0417 created — insider_fraud (0.98)", "severity": "critical"},
    {"time": "08:25:42", "type": "TXN", "text": "RTGS ₹9,40,000 initiated by EMP-0231", "severity": "high"},
    {"time": "08:24:07", "type": "BANKING", "text": "New beneficiary BEN-9910 added to ACC-58831", "severity": "medium"},
]

# --- WebSocket Connections ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect(dead)

manager = ConnectionManager()

# --- Background Simulator ---

SIM_EVENT_TEMPLATES = [
    {"type": "ACCESS", "text": "Employee EMP-0102 accessed ACC-33210 (routine)", "severity": "low"},
    {"type": "TXN", "text": "UPI ₹2,400 from CUST-1122 to BEN-5501", "severity": "low"},
    {"type": "VPN", "text": "VPN login EMP-0044 from Delhi (usual)", "severity": "low"},
    {"type": "AUTH", "text": "Password change CUST-2201 via mobile app", "severity": "low"},
    {"type": "TXN", "text": "NEFT ₹15,000 from ACC-22100 approved", "severity": "low"},
    {"type": "EDR", "text": "Device DEV-0881 OS update detected", "severity": "low"},
    {"type": "ACCESS", "text": "EMP-0190 viewed loan records (authorized)", "severity": "low"},
    {"type": "TXN", "text": "ATM withdrawal ₹10,000 CUST-3305", "severity": "low"},
    {"type": "IAM", "text": "Scheduled privilege review completed", "severity": "low"},
    {"type": "SCORING", "text": "Risk scores updated for 312 entities", "severity": "medium"},
]

NEW_INCIDENTS_TEMPLATES = [
    {
        "id": "INC-0418",
        "risk_score": 0.93,
        "intent_label": "api_abuse",
        "entities_involved": ["CUST-5883", "DEV-0445", "ACC-58831"],
        "causal_chain": [
            {"label": "Rapid API calls to /transfer (40req/sec)", "time": "09:40:02 UTC", "system": "API Gateway", "critical": True},
            {"label": "Request bypasses standard captcha check", "time": "09:40:15 UTC", "system": "WAF", "critical": False},
            {"label": "Unauthorized debit simulation on ACC-58831", "time": "09:41:10 UTC", "system": "Core Banking", "critical": True}
        ],
        "top_evidence": [
            {"feature": "api_velocity", "value": 0.97, "direction": "positive"},
            {"feature": "ip_entropy", "value": 0.81, "direction": "positive"},
            {"feature": "signature_novelty", "value": 0.76, "direction": "positive"}
        ],
        "recommended_actions": ["Rate limit IP address", "Lock customer DEV-0445", "Force API token rotation"]
    },
    {
        "id": "INC-0419",
        "risk_score": 0.87,
        "intent_label": "sim_swap_anomaly",
        "entities_involved": ["CUST-4412", "DEV-2088"],
        "causal_chain": [
            {"label": "SIM replacement registry notification received", "time": "10:12:00 UTC", "system": "Carrier Sync", "critical": False},
            {"label": "Immediate attempt to link new device DEV-2088", "time": "10:13:40 UTC", "system": "IAM", "critical": True},
            {"label": "High-risk password reset from SIM device", "time": "10:14:15 UTC", "system": "Auth Gateway", "critical": True}
        ],
        "top_evidence": [
            {"feature": "sim_age_at_login", "value": 0.94, "direction": "positive"},
            {"feature": "device_novelty", "value": 0.89, "direction": "positive"},
            {"feature": "login_hour_deviation", "value": 0.44, "direction": "positive"}
        ],
        "recommended_actions": ["Hold transfers for 24 hours", "Verify ID with customer service", "Revoke active token"]
    }
]

async def event_generator_loop():
    """Generates continuous stream of system events."""
    while True:
        await asyncio.sleep(random.uniform(2.5, 4.5))
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
        template = random.choice(SIM_EVENT_TEMPLATES)
        
        # update global metrics
        metrics_db.eventsProcessed += random.randint(1, 4)
        
        new_event = {
            "time": now_str,
            "type": template["type"],
            "text": template["text"],
            "severity": template["severity"]
        }
        recent_events_db.insert(0, new_event)
        if len(recent_events_db) > 50:
            recent_events_db.pop()

        # broadcast event
        await manager.broadcast({
            "type": "NEW_EVENT",
            "data": {
                "event": new_event,
                "metrics": metrics_db.model_dump()
            }
        })

async def incident_generator_loop():
    """Generates new incidents and updates entity scores at a slower pace."""
    incident_index = 0
    while True:
        await asyncio.sleep(random.uniform(30.0, 50.0))
        if incident_index >= len(NEW_INCIDENTS_TEMPLATES):
            # No more templates, just update existing entities randomly
            entity_to_update = random.choice(entities_db)
            old_score = entity_to_update.risk_score
            new_score = min(0.99, max(0.01, old_score + random.uniform(-0.15, 0.15)))
            entity_to_update.risk_score = round(new_score, 2)
            entity_to_update.risk_trend.append(entity_to_update.risk_score)
            if len(entity_to_update.risk_trend) > 15:
                entity_to_update.risk_trend.pop(0)
            
            # update node risk in graph db
            for node in graph_db.nodes:
                if node.id == entity_to_update.id:
                    node.risk = entity_to_update.risk_score

            await manager.broadcast({
                "type": "ENTITY_UPDATE",
                "data": {
                    "entity": entity_to_update.model_dump(),
                    "graph": graph_db.model_dump()
                }
            })
            continue

        template = NEW_INCIDENTS_TEMPLATES[incident_index]
        incident_index += 1

        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
        created_at_iso = datetime.now(timezone.utc).isoformat()

        # Build Incident
        chain_steps = []
        for step in template["causal_chain"]:
            chain_steps.append(ChainStep(
                label=step["label"],
                time=step.get("time", now_str),
                system=step["system"],
                critical=step.get("critical", False)
            ))

        new_incident = Incident(
            id=template["id"],
            risk_score=template["risk_score"],
            intent_label=template["intent_label"],
            status="open",
            entities_involved=template["entities_involved"],
            causal_chain=chain_steps,
            top_evidence=[
                Evidence(
                    feature=str(ev["feature"]),
                    value=float(ev["value"]),
                    direction=str(ev["direction"])
                )
                for ev in template["top_evidence"]
                if isinstance(ev, dict)
            ],
            recommended_actions=template["recommended_actions"],
            created_at=created_at_iso
        )

        incidents_db.insert(0, new_incident)
        
        # update entities involved
        for ent_id in template["entities_involved"]:
            # check if entity exists
            entity_found = False
            for ent in entities_db:
                if ent.id == ent_id:
                    ent.risk_score = template["risk_score"]
                    ent.risk_trend.append(ent.risk_score)
                    if len(ent.risk_trend) > 15:
                        ent.risk_trend.pop(0)
                    ent.last_activity = created_at_iso
                    entity_found = True
                    break
            
            if not entity_found:
                # create dynamic new entity
                new_ent = Entity(
                    id=ent_id,
                    type="device" if "DEV" in ent_id else "account" if "ACC" in ent_id else "customer" if "CUST" in ent_id else "employee",
                    name=f"Involved Node {ent_id}",
                    risk_score=template["risk_score"],
                    risk_trend=[0.1, 0.2, template["risk_score"]],
                    features=[],
                    last_activity=created_at_iso
                )
                entities_db.append(new_ent)
                # add to graph
                graph_db.nodes.append(GraphNode(id=ent_id, label=ent_id, type=new_ent.type.capitalize(), risk=new_ent.risk_score))

        # Update metrics
        metrics_db.activeIncidents = len([i for i in incidents_db if i.status != 'resolved'])
        metrics_db.criticalEntities = len([e for e in entities_db if e.risk_score >= 0.8])
        
        # Add new incident announcement event
        announcement_event = {
            "time": now_str,
            "type": "INCIDENT",
            "text": f"{new_incident.id} created — {new_incident.intent_label} ({new_incident.risk_score})",
            "severity": "critical"
        }
        recent_events_db.insert(0, announcement_event)
        if len(recent_events_db) > 50:
            recent_events_db.pop()

        # broadcast new incident
        await manager.broadcast({
            "type": "NEW_INCIDENT",
            "data": {
                "incident": new_incident.model_dump(),
                "event": announcement_event,
                "entities": [e.model_dump() for e in entities_db],
                "graph": graph_db.model_dump(),
                "metrics": metrics_db.model_dump()
            }
        })

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(event_generator_loop())
    asyncio.create_task(incident_generator_loop())

# --- REST API Endpoints ---

@app.get("/api/metrics", response_model=Metrics)
async def get_metrics():
    # Dynamic calculation
    metrics_db.activeIncidents = len([i for i in incidents_db if i.status != 'resolved'])
    metrics_db.criticalEntities = len([e for e in entities_db if e.risk_score >= 0.8])
    return metrics_db

@app.get("/api/incidents", response_model=List[Incident])
async def get_incidents():
    return incidents_db

@app.get("/api/incidents/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str):
    for inc in incidents_db:
        if inc.id == incident_id:
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")

@app.post("/api/incidents/{incident_id}/status")
async def update_incident_status(incident_id: str, payload: dict):
    new_status = payload.get("status")
    if new_status not in ["open", "investigating", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    for inc in incidents_db:
        if inc.id == incident_id:
            inc.status = new_status
            # Update metrics
            metrics_db.activeIncidents = len([i for i in incidents_db if i.status != 'resolved'])
            
            # Broadcast the update
            await manager.broadcast({
                "type": "INCIDENT_STATUS_CHANGE",
                "data": {
                    "incident": inc.model_dump(),
                    "metrics": metrics_db.model_dump()
                }
            })
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")

@app.post("/api/incidents/{incident_id}/execute")
async def execute_action(incident_id: str, payload: dict):
    action = payload.get("action")
    if not action:
        raise HTTPException(status_code=400, detail="Action is required")
        
    for inc in incidents_db:
        if inc.id == incident_id:
            # Simulate execution event
            now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
            exec_event = {
                "time": now_str,
                "type": "MITIGATION",
                "text": f"Executed action '{action}' for {incident_id}",
                "severity": "medium"
            }
            recent_events_db.insert(0, exec_event)
            
            await manager.broadcast({
                "type": "ACTION_EXECUTED",
                "data": {
                    "incident_id": incident_id,
                    "action": action,
                    "event": exec_event
                }
            })
            return {"status": "success", "message": f"Action '{action}' executed"}
    raise HTTPException(status_code=404, detail="Incident not found")

@app.get("/api/entities", response_model=List[Entity])
async def get_entities():
    return entities_db

@app.get("/api/entities/{entity_id}", response_model=Entity)
async def get_entity(entity_id: str):
    for ent in entities_db:
        if ent.id == entity_id:
            return ent
    raise HTTPException(status_code=404, detail="Entity not found")

@app.get("/api/graph", response_model=GraphData)
async def get_graph():
    return graph_db

# --- Copilot / Graph RAG ---

COPILOT_PRESETS = {
    "show me the full attack chain for inc-0420": (
        "**INC-0420 — Quantum Harvest Attack (Risk: 0.95)**\n\nThe attack chain consists of 5 steps spanning 7 minutes:\n\n"
        "1. **11:02:14** — TLS version downgrade detected (non-PQC curves negotiated) on Edge Gateway\n"
        "2. **11:03:01** — Bulk SSL session key export anomaly from HSM / Key Store\n"
        "3. **11:05:40** — Anomalous off-hours read queries on encrypted db archives by EMP-0087\n"
        "4. **11:08:12** — Data egress: 240 GB exfiltrated via unauthorized channel from DEV-0311 (critical)\n"
        "5. **11:09:44** — Target IP identified as active Harvest-Now-Decrypt-Later collection node (critical)\n\n"
        "Top contributing features: `tls_pqc_downgrade=0.95`, `exfiltration_volume_zscore=0.89`, `ip_reputation_score=0.82`\n\n"
        "**Assessment:** High-confidence 'Harvest Now, Decrypt Later' threat. The attacker compromised DEV-0311 (used by EMP-0087), downgraded the TLS version to negotiate weaker cryptography, exported bulk session keys from the HSM to decrypt intercepted traffic later, and exfiltrated 240 GB of encrypted database archives to a known collection IP."
    ),
    "what are the indicators of the quantum harvest attack?": (
        "**Quantum Harvest Indicators of Compromise (IOCs) & Signals**\n\n"
        "1. **TLS Protocol Downgrade:** Negotiation of weak curves/non-PQC algorithms (e.g., standard ECDHE instead of ML-KEM/Kyber) to intercept communications.\n"
        "2. **Bulk SSL Session Key Export:** HSM or crypto-provider logs showing unusual session key exports, allowing decrypting captured traffic.\n"
        "3. **High Volume Data Egress:** Sudden bulk transfers (e.g., 240 GB database archives) to unverified or suspicious external IPs.\n"
        "4. **Harvest-Now-Decrypt-Later (HNDL) Node IP:** Egress connections targeting known hosting providers or IPs flagged as encrypted-traffic collection points.\n"
        "5. **Dormant/Off-hours Encrypted DB Read Queries:** Unusual volume of database read events targeting encrypted tables containing long-lived sensitive data."
    ),
    "show me the full attack chain for inc-0417": (
        "**INC-0417 — Insider Fraud (Risk: 0.98)**\n\nThe attack chain consists of 6 steps spanning 13 minutes:\n\n"
        "1. **08:12:04** — VPN login from new location (Mumbai → Kolkata)\n"
        "2. **08:12:18** — New device DEV-1042 registered, trust score 0.1\n"
        "3. **08:14:55** — Privilege escalation: teller → approver\n"
        "4. **08:22:31** — Dormant account ACC-58831 accessed\n"
        "5. **08:24:07** — New beneficiary BEN-9910 added\n"
        "6. **08:25:42** — RTGS transfer initiated: ₹9,40,000\n\n"
        "Top contributing features: `device_novelty=1.0`, `privilege_delta=+2`, `beneficiary_age_at_txn=0.4h`\n\n"
        "**Assessment:** This is a high-confidence insider fraud scenario. The employee used a compromised or new device "
        "from an unusual location, escalated privileges, then immediately executed a transfer to a beneficiary through a dormant account."
    ),
    "which employees accessed dormant accounts this week?": (
        "**Dormant Account Access Report (Last 7 Days)**\n\n"
        "| Employee | Account | Time | Risk |\n"
        "|----------|---------|------|------|\n"
        "| EMP-0231 (R. Mehta) | ACC-58831 | Jul 16, 08:22 | 🔴 0.96 |\n"
        "| EMP-0044 (S. Kumar) | ACC-41200 | Jul 14, 14:30 | 🟢 0.12 |\n"
        "| EMP-0190 (A. Reddy) | ACC-55020 | Jul 13, 09:15 | 🟢 0.08 |\n\n"
        "Only **EMP-0231** triggered anomaly detection — the access was part of a broader insider fraud chain (INC-0417). "
        "The other two accesses were authorized account reactivations with matching business tickets."
    ),
    "what is the risk score trend for emp-0231?": (
        "**EMP-0231 (Rajesh Mehta) — Risk Score Trend**\n\nThe risk score showed a dramatic spike in the last 3 periods:\n\n"
        "```\nDay -10: 0.12 (baseline)\nDay -8:  0.14\nDay -6:  0.11\nDay -4:  0.15\nDay -3:  0.22 ← first deviation\nDay -2:  0.45 ← accelerating\nDay -1:  0.78 ← anomaly threshold\nToday:   0.96 ← critical\n```\n\n"
        "The Isolation Forest flagged this entity at Day -2 (score 0.45). By today, GraphSAGE propagated additional risk from "
        "the connected transaction and beneficiary nodes, pushing the score to 0.96."
    )
}

@app.post("/api/copilot", response_model=CopilotResponse)
async def copilot_query(payload: CopilotQuery):
    query_lower = payload.query.lower().strip()
    
    # 1. Custom matches for INC-0420 attack chain / details
    if "inc-0420" in query_lower:
        if any(kw in query_lower for kw in ["attack chain", "chain", "evidence", "investigate", "details", "explain", "why"]):
            return CopilotResponse(content=COPILOT_PRESETS["show me the full attack chain for inc-0420"])
            
    # 2. Custom matches for INC-0417 attack chain / details
    if "inc-0417" in query_lower:
        if any(kw in query_lower for kw in ["attack chain", "chain", "evidence", "investigate", "details", "explain", "why"]):
            return CopilotResponse(content=COPILOT_PRESETS["show me the full attack chain for inc-0417"])

    # 3. Custom matches for Quantum Harvest Indicators
    if "quantum" in query_lower:
        if any(kw in query_lower for kw in ["indicator", "ioc", "sign", "signal", "harvest", "threat", "risk", "attack"]):
            return CopilotResponse(content=COPILOT_PRESETS["what are the indicators of the quantum harvest attack?"])

    # 4. Custom matches for Dormant account access
    if "dormant" in query_lower:
        return CopilotResponse(content=COPILOT_PRESETS["which employees accessed dormant accounts this week?"])

    # 5. Custom matches for EMP-0231 trend
    if "emp-0231" in query_lower and "trend" in query_lower:
        return CopilotResponse(content=COPILOT_PRESETS["what is the risk score trend for emp-0231?"])

    # 6. List incidents
    if any(kw in query_lower for kw in ["list incidents", "active incidents", "show all incidents", "show incidents", "all incidents", "incidents"]):
        content = (
            "### 📋 Active Security Incidents\n\n"
            "Here is the list of currently tracked security incidents in the environment:\n\n"
            "| Incident ID | Intent Label | Risk Score | Status | Created At |\n"
            "|-------------|--------------|------------|--------|------------|\n"
        )
        for inc in incidents_db:
            risk_emoji = "🔴" if inc.risk_score >= 0.85 else ("🟡" if inc.risk_score >= 0.6 else "🟢")
            content += f"| `{inc.id}` | {inc.intent_label} | {risk_emoji} {inc.risk_score:.2f} | `{inc.status}` | {inc.created_at} |\n"
        content += "\nTo investigate a specific incident, query its ID (e.g. `Show me INC-0420`)."
        return CopilotResponse(content=content)

    # 7. List entities
    if any(kw in query_lower for kw in ["list entities", "monitored entities", "show entities", "all entities", "critical entities", "entities"]):
        content = (
            "### 👤 Monitored System Entities\n\n"
            "Here is the list of active entities and their evaluated risk profiles:\n\n"
            "| Entity ID | Name | Type | Role / Access | Risk Score |\n"
            "|-----------|------|------|---------------|------------|\n"
        )
        for ent in entities_db:
            risk_pct = ent.risk_score * 100
            risk_emoji = "🔴" if ent.risk_score >= 0.85 else ("🟡" if ent.risk_score >= 0.5 else "🟢")
            role_access = f"{ent.role or ''} / {ent.access_level or ''}".strip(" /") or "N/A"
            content += f"| `{ent.id}` | {ent.name} | `{ent.type}` | {role_access} | {risk_emoji} {risk_pct:.0f}% |\n"
        content += "\nTo inspect any entity profile, search for their name or ID (e.g. `Show profile for Rajesh Mehta` or `EMP-0231`)."
        return CopilotResponse(content=content)

    # 8. System metrics and overview
    if any(kw in query_lower for kw in ["system data", "metrics", "stats", "active models", "models", "overall stats", "performance", "average response time", "events processed"]):
        # recalculate metrics
        metrics_db.activeIncidents = len([i for i in incidents_db if i.status != 'resolved'])
        metrics_db.criticalEntities = len([e for e in entities_db if e.risk_score >= 0.8])
        content = (
            "### 📊 Sentinel Nexus System Performance & Threat Metrics\n\n"
            "Here is the current state of the cybersecurity telemetry correlation system:\n\n"
            "| Metric | Current Value | Description |\n"
            "|--------|---------------|-------------|\n"
            f"| **Active Incidents** | {metrics_db.activeIncidents} | Open or active security threat investigations |\n"
            f"| **Critical Entities** | {metrics_db.criticalEntities} | Entities with evaluated risk score > 80% |\n"
            f"| **Events Processed** | {metrics_db.eventsProcessed:,} | Telemetry events correlated in feature store |\n"
            f"| **Avg Response Time** | {metrics_db.avgResponseTime:.2f}s | Mean automated alert-to-investigation duration |\n"
            f"| **Entities Monitored** | {metrics_db.entitiesMonitored:,} | Total network, database, user, and device nodes |\n"
            f"| **Active ML Models** | {metrics_db.modelsActive} | Anomaly detection & graph embedding models running |\n\n"
            "**Active ML/AI Models in Pipeline:**\n"
            "- **Isolation Forest**: Flagging multi-dimensional outliers in feature store behavior DNA\n"
            "- **XGBoost Classifier**: Supervised classification of transactional fraud pattern history\n"
            "- **GraphSAGE**: Relational graph neural network propagating entity risk scores across neighbors\n"
            "- **LSTM Neural Net**: Sequence prediction modeling anomaly steps in causal network paths\n"
            "- **Quantum Risk Monitor**: Tracking TLS downgrade behaviors and harvest-now-decrypt-later indicators"
        )
        return CopilotResponse(content=content)

    # Check if querying specific incident
    for inc in incidents_db:
        if inc.id.lower() in query_lower:
            actions_list = "\n".join([f"- {action}" for action in inc.recommended_actions])
            return CopilotResponse(content=(
                f"### 🔍 Investigation Details for {inc.id}\n\n"
                f"- **Intent Label**: `{inc.intent_label}`\n"
                f"- **Evaluated Risk Score**: `{inc.risk_score}`\n"
                f"- **Investigation Status**: `{inc.status}`\n"
                f"- **Involved Entities**: {', '.join([f'`{e}`' for e in inc.entities_involved])}\n\n"
                f"#### 📊 CONTRIBUTING SHAP EVIDENCE\n\n"
                f"| Feature Name | Value / Z-score | Correlation Direction |\n"
                f"|--------------|-----------------|-----------------------|\n"
                + "\n".join([f"| `{ev.feature}` | {ev.value:.2f} | {ev.direction} |" for ev in inc.top_evidence]) +
                "\n\n#### ⛓️ CORRELATED ATTACK STEPS (CAUSAL CHAIN)\n\n"
                + "\n".join([f"{idx+1}. **{step.time}** `[{step.system}]` {step.label}" for idx, step in enumerate(inc.causal_chain)]) +
                f"\n\n#### 🛡️ RECOMMENDED MITIGATION ACTIONS\n\n"
                f"{actions_list}"
            ))

    # Check if querying specific entity
    for ent in entities_db:
        if ent.id.lower() in query_lower or ent.name.lower() in query_lower:
            role_str = f" ({ent.role})" if ent.role else ""
            content = (
                f"### 👤 Profile Details: {ent.name}{role_str}\n\n"
                f"- **Entity ID**: `{ent.id}`\n"
                f"- **Type**: `{ent.type}`\n"
                f"- **Department**: `{ent.department or 'N/A'}`\n"
                f"- **Branch Location**: `{ent.branch or 'N/A'}`\n"
                f"- **Access Control Level**: `{ent.access_level or 'Standard'}`\n"
                f"- **Evaluated Risk Score**: `{(ent.risk_score*100):.0f}%` (Ranked: **{'High' if ent.risk_score > 0.8 else 'Medium' if ent.risk_score > 0.3 else 'Low'}**)\n"
                f"- **Last Monitored Activity**: `{ent.last_activity}`\n\n"
            )
            if ent.features:
                content += "#### 🧬 BEHAVIOR DNA FEATURE DEVIATIONS\n\n"
                content += "| Feature Name | Current Value | Deviation from Baseline |\n"
                content += "|--------------|---------------|-------------------------|\n"
                content += "\n".join([f"| `{f.name}` | {f.value:.2f} | {f.deviation*100:+.1f}% |" for f in ent.features])
            return CopilotResponse(content=content)

    # General fallback response
    return CopilotResponse(content=(
        f"I analyzed the query across the knowledge graph and active models.\n\n"
        f"**Query**: \"{payload.query}\"\n\n"
        f"Here are the environment summary facts:\n"
        f"- Monitored Entities: **{len(entities_db)}**\n"
        f"- Tracked Incidents: **{len(incidents_db)}**\n"
        f"- Active ML Models: **5** (Isolation Forest, XGBoost, GraphSAGE, LSTM, Quantum Risk Monitor)\n\n"
        f"Please refine your query or ask about specific entities (e.g. `EMP-0231`), "
        f"incidents (e.g. `INC-0420`), or dormant account activity."
    ))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial database snapshot upon connection
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "data": {
                "incidents": [i.model_dump() for i in incidents_db],
                "entities": [e.model_dump() for e in entities_db],
                "metrics": metrics_db.model_dump(),
                "events": recent_events_db,
                "graph": graph_db.model_dump()
            }
        })
        while True:
            # Keep-alive loop or receive client updates if needed
            await websocket.receive_text()
            # Echo or process client command if any
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
