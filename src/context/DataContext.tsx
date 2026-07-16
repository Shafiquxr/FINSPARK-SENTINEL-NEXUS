import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Incident, Entity, GraphNode, GraphEdge } from '../data/mockData';

interface Metrics {
  activeIncidents: number;
  criticalEntities: number;
  eventsProcessed: number;
  avgResponseTime: number;
  entitiesMonitored: number;
  modelsActive: number;
}

interface EventLog {
  time: string;
  type: string;
  text: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface DataContextType {
  incidents: Incident[];
  entities: Entity[];
  metrics: Metrics;
  events: EventLog[];
  graphData: GraphData;
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  updateIncidentStatus: (id: string, status: 'open' | 'investigating' | 'resolved') => Promise<void>;
  executeAction: (id: string, action: string) => Promise<void>;
  askCopilot: (query: string) => Promise<string>;
  connected: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    activeIncidents: 0,
    criticalEntities: 0,
    eventsProcessed: 0,
    avgResponseTime: 0,
    entitiesMonitored: 0,
    modelsActive: 0
  });
  const [events, setEvents] = useState<EventLog[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [isLive, setIsLive] = useState(true);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    if (!isLive) return;

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
    }

    const ws = new WebSocket('ws://127.0.0.1:8000/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log('WebSocket Connected to Sentinel Nexus Backend');
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const { type, data } = msg;

      switch (type) {
        case 'INITIAL_STATE':
          if (data.incidents) setIncidents(data.incidents);
          if (data.entities) setEntities(data.entities);
          if (data.metrics) setMetrics(data.metrics);
          if (data.events) setEvents(data.events);
          if (data.graph) setGraphData(data.graph);
          break;
        case 'NEW_EVENT':
          if (data.event) {
            setEvents((prev) => [data.event, ...prev].slice(0, 50));
          }
          if (data.metrics) {
            setMetrics(data.metrics);
          }
          break;
        case 'NEW_INCIDENT':
          if (data.incident) {
            setIncidents((prev) => [data.incident, ...prev]);
          }
          if (data.event) {
            setEvents((prev) => [data.event, ...prev].slice(0, 50));
          }
          if (data.entities) {
            setEntities(data.entities);
          }
          if (data.graph) {
            setGraphData(data.graph);
          }
          if (data.metrics) {
            setMetrics(data.metrics);
          }
          break;
        case 'INCIDENT_STATUS_CHANGE':
          if (data.incident) {
            setIncidents((prev) =>
              prev.map((inc) => (inc.id === data.incident.id ? data.incident : inc))
            );
          }
          if (data.metrics) {
            setMetrics(data.metrics);
          }
          break;
        case 'ACTION_EXECUTED':
          if (data.event) {
            setEvents((prev) => [data.event, ...prev].slice(0, 50));
          }
          break;
        case 'ENTITY_UPDATE':
          if (data.entity) {
            setEntities((prev) =>
              prev.map((ent) => (ent.id === data.entity.id ? data.entity : ent))
            );
          } else if (data.entities) {
            setEntities(data.entities);
          }
          if (data.graph) {
            setGraphData(data.graph);
          }
          break;
        default:
          break;
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
        setConnected(false);
        console.log('WebSocket Disconnected. Reconnecting in 3s...');
        setTimeout(() => {
          if (isLive) connectWebSocket();
        }, 3000);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
      ws.close();
    };

    return ws;
  }, [isLive]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        const socket = wsRef.current;
        wsRef.current = null;
        socket.close();
      }
    };
  }, [connectWebSocket, isLive]);

  // Initial HTTP fallback if WebSocket fails or takes time
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [incRes, entRes, metRes, grRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/incidents'),
          fetch('http://127.0.0.1:8000/api/entities'),
          fetch('http://127.0.0.1:8000/api/metrics'),
          fetch('http://127.0.0.1:8000/api/graph'),
        ]);
        if (incRes.ok && entRes.ok && metRes.ok && grRes.ok) {
          setIncidents(await incRes.json());
          setEntities(await entRes.json());
          setMetrics(await metRes.json());
          setGraphData(await grRes.json());
        }
      } catch (err) {
        console.warn('Backend HTTP fetch failed. Ensure server is running at http://127.0.0.1:8000', err);
      }
    };
    fetchInitial();
  }, []);

  const updateIncidentStatus = async (id: string, status: 'open' | 'investigating' | 'resolved') => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/incidents/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setIncidents((prev) =>
          prev.map((inc) => (inc.id === id ? updated : inc))
        );
        // Refresh metrics
        const metRes = await fetch('http://127.0.0.1:8000/api/metrics');
        if (metRes.ok) setMetrics(await metRes.json());
      }
    } catch (err) {
      console.error('Failed to update incident status:', err);
    }
  };

  const executeAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/incidents/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        console.log(`Action '${action}' executed successfully on ${id}`);
      }
    } catch (err) {
      console.error('Failed to execute action:', err);
    }
  };

  const askCopilot = async (query: string): Promise<string> => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.content;
      }
    } catch (err) {
      console.error('Failed to ask Copilot:', err);
    }
    return 'Error: Could not connect to AI Copilot backend server. Please verify the backend is running.';
  };

  return (
    <DataContext.Provider
      value={{
        incidents,
        entities,
        metrics,
        events,
        graphData,
        isLive,
        setIsLive,
        updateIncidentStatus,
        executeAction,
        askCopilot,
        connected,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
