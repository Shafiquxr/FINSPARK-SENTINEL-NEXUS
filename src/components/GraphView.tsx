import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import type { GraphNode, GraphEdge } from '../data/mockData';

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function GraphView({ nodes, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements: cytoscape.ElementDefinition[] = [
      ...nodes.map(n => ({
        data: { id: n.id, label: n.label, nodeType: n.type, risk: n.risk ?? 0 },
      })),
      ...edges.map((e, i) => ({
        data: { id: `e${i}`, source: e.source, target: e.target, label: e.label },
      })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1e293b',
            'label': 'data(label)',
            'color': '#0f172a',
            'font-size': '10px',
            'font-family': 'Inter, sans-serif',
            'font-weight': '600',
            'text-margin-y': -8,
            'text-valign': 'top',
            'text-halign': 'center',
            'width': 'mapData(risk, 0, 1, 24, 50)',
            'height': 'mapData(risk, 0, 1, 24, 50)',
            'border-width': 2.5,
            'border-color': '#ffffff',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.95,
            'text-background-padding': '4px',
            'text-background-shape': 'round-rectangle',
            'text-border-color': '#e2e8f0',
            'text-border-width': 1,
            'text-border-opacity': 0.8,
            'transition-property': 'background-color, border-color, border-width, opacity, scale',
            'transition-duration': 0.2,
          } as any,
        },
        {
          selector: 'node[nodeType="Employee"]',
          style: { 'shape': 'round-rectangle' as any, 'background-color': '#0f172a' },
        },
        {
          selector: 'node[nodeType="Device"]',
          style: { 'shape': 'diamond' as any, 'background-color': '#475569' },
        },
        {
          selector: 'node[nodeType="Account"]',
          style: { 'shape': 'ellipse', 'background-color': '#334155' },
        },
        {
          selector: 'node[nodeType="Transaction"]',
          style: { 'shape': 'star' as any, 'background-color': '#ef4444', 'border-color': '#ef4444' },
        },
        {
          selector: 'node[nodeType="Beneficiary"]',
          style: { 'shape': 'triangle' as any, 'background-color': '#64748b' },
        },
        {
          selector: 'node[nodeType="Customer"]',
          style: { 'shape': 'ellipse', 'background-color': '#94a3b8' },
        },
        {
          selector: 'node[nodeType="Branch"]',
          style: { 'shape': 'round-rectangle' as any, 'background-color': '#cbd5e1', 'border-color': '#94a3b8' },
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-color': '#0f172a',
            'border-width': 4,
            'scale': 1.15,
            'z-index': 9999,
          } as any,
        },
        {
          selector: 'node.dimmed',
          style: {
            'opacity': 0.25,
          } as any,
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#cbd5e1',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle' as any,
            'curve-style': 'bezier' as any,
            'label': 'data(label)',
            'font-size': '8px',
            'color': '#64748b',
            'text-rotation': 'autorotate' as any,
            'font-family': 'JetBrains Mono, monospace',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.9,
            'text-background-padding': '2px',
            'transition-property': 'line-color, target-arrow-color, width, opacity',
            'transition-duration': 0.2,
          } as any,
        },
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#0f172a',
            'target-arrow-color': '#0f172a',
            'width': 3,
            'z-index': 9998,
          } as any,
        },
        {
          selector: 'edge.dimmed',
          style: {
            'opacity': 0.15,
          } as any,
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 40,
        nodeRepulsion: () => 60000,
        idealEdgeLength: () => 100,
        nodeOverlap: 20,
        gravity: 1,
      } as any,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      const neighborhood = node.neighborhood();
      
      cy.elements().addClass('dimmed');
      
      node.removeClass('dimmed').addClass('highlighted');
      neighborhood.removeClass('dimmed').addClass('highlighted');
    });

    cy.on('mouseout', 'node', () => {
      cy.elements().removeClass('dimmed').removeClass('highlighted');
    });

    cyRef.current = cy;

    const resizeObserver = new ResizeObserver(() => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit(undefined, 30);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      cy.destroy();
    };
  }, [nodes, edges]);

  return (
    <div className="graph-container">
      <div ref={containerRef} className="graph-canvas" />
      <div className="graph-legend">
        {[
          { label: 'Employee', color: '#0f172a' },
          { label: 'Account', color: '#334155' },
          { label: 'Device', color: '#475569' },
          { label: 'Transaction', color: '#ef4444' },
          { label: 'Beneficiary', color: '#64748b' },
          { label: 'Customer', color: '#94a3b8' },
        ].map(item => (
          <div key={item.label} className="graph-legend-item">
            <div className="graph-legend-dot" style={{ borderColor: item.color, background: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
