import cytoscape from 'cytoscape';

export const topicKey = value => `topic::${String(value || 'Core Java').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
export function addGeometry(graph) {
  const sorted = [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const cy = cytoscape({ headless: true, styleEnabled: false, elements: [
    ...sorted.map((node, i) => ({ data: { id: node.id }, position: { x: i % 10 * 140, y: Math.floor(i / 10) * 140 } })),
    ...[...graph.edges].sort((a, b) => a.id.localeCompare(b.id, 'en')).map(edge => ({ data: edge }))
  ], layout: { name: 'preset' } });
  try {
    cy.layout({ name: 'cose', animate: false, randomize: false, boundingBox: { x1: 0, y1: 0, w: 1600, h: 1200 },
      nodeRepulsion: 12000, idealEdgeLength: 120, edgeElasticity: 130, gravity: 0.22, numIter: 1000 }).run();
    const expanded = Object.fromEntries(sorted.map(node => [node.id, Object.fromEntries(['x', 'y'].map(axis => [axis, Math.round(cy.getElementById(node.id).position(axis) * 100) / 100]))]));
    const topics = [...new Set(sorted.map(node => topicKey(node.topic)))].sort();
    const collapsed = Object.fromEntries(topics.map((id, i) => [id, { x: Math.round(480 * Math.cos(i * 2 * Math.PI / topics.length)), y: Math.round(480 * Math.sin(i * 2 * Math.PI / topics.length)) }]));
    const geometry = { version: 1, expanded, collapsed };
    validateGeometry({ ...graph, geometry });
    return { ...graph, geometry };
  } finally { cy.destroy(); }
}

export function validateGeometry(graph) {
  for (const [key, ids] of [['expanded', graph.nodes.map(node => node.id)], ['collapsed', graph.nodes.map(node => topicKey(node.topic))]]) {
    for (const id of ids) {
      const point = graph.geometry?.[key]?.[id];
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new Error(`Missing or invalid ${key} geometry: ${id}`);
    }
  }
}
