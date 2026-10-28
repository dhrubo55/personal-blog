import assert from 'node:assert/strict';
import test from 'node:test';
import { addGeometry, validateGeometry } from '../scripts/graph-layout.mjs';

test('geometry is deterministic, finite and additive without changing graph facts', () => {
  const graph = { nodes: [{ id: 'b', topic: 'Threads', url: '/b/' }, { id: 'a', topic: 'Memory', url: '/a/' }], edges: [{ id: 'ab', source: 'a', target: 'b', type: 'reference' }] };
  const first = addGeometry(graph);
  assert.deepEqual(first, addGeometry(graph));
  assert.deepEqual(first.nodes, graph.nodes);
  assert.deepEqual(first.edges, graph.edges);
  assert.deepEqual(Object.keys(first.geometry.expanded), ['a', 'b']);
  validateGeometry(first);
  first.geometry.expanded.a.x = NaN;
  assert.throws(() => validateGeometry(first), /invalid expanded geometry/);
  delete first.geometry.expanded.a;
  assert.throws(() => validateGeometry(first), /Missing/);
});
