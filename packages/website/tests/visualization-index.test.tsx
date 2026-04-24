/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect } from 'vitest';

import visualizations from '../src/components/visualization/index';

describe('visualization index', () => {
  test('exports an array of two components', () => {
    expect(Array.isArray(visualizations)).toBe(true);
    expect(visualizations.length).toBe(2);
  });

  test('first visualization is Tree', () => {
    expect(visualizations[0].name).toBe('Tree');
  });

  test('second visualization is JSON', () => {
    expect(visualizations[1].name).toBe('JSON');
  });

  test('all visualizations have a component function', () => {
    for (const viz of visualizations) {
      expect(typeof viz).toBe('object');
      expect(typeof viz.component).toBe('function');
      expect(typeof viz.name).toBe('string');
    }
  });
});
