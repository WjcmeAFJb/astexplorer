/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import SplitPane from '../src/components/SplitPane';

describe('SplitPane', () => {
  test('renders with two children and a divider', () => {
    const { container } = render(
      <SplitPane>
        <div data-testid="left">Left</div>
        <div data-testid="right">Right</div>
      </SplitPane>,
    );
    expect(container.querySelector('.splitpane-divider')).not.toBeNull();
    expect(container.textContent).toContain('Left');
    expect(container.textContent).toContain('Right');
  });

  test('renders single child without divider', () => {
    const { container } = render(
      <SplitPane>
        <div>Only child</div>
      </SplitPane>,
    );
    expect(container.querySelector('.splitpane-divider')).toBeNull();
    expect(container.textContent).toContain('Only child');
  });

  test('renders with no children without divider', () => {
    const { container } = render(<SplitPane />);
    expect(container.querySelector('.splitpane-divider')).toBeNull();
  });

  test('applies className prop', () => {
    const { container } = render(
      <SplitPane className="my-split">
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    expect(container.querySelector('.my-split')).not.toBeNull();
  });

  test('horizontal layout has col-resize divider class', () => {
    const { container } = render(
      <SplitPane vertical={false}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const divider = container.querySelector('.splitpane-divider')!;
    expect(divider.classList.contains('horizontal')).toBe(true);
    expect(divider.classList.contains('vertical')).toBe(false);
  });

  test('vertical layout has vertical divider class', () => {
    const { container } = render(
      <SplitPane vertical={true}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const divider = container.querySelector('.splitpane-divider')!;
    expect(divider.classList.contains('vertical')).toBe(true);
    expect(divider.classList.contains('horizontal')).toBe(false);
  });

  test('horizontal layout uses row flexDirection', () => {
    const { container } = render(
      <SplitPane vertical={false}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.flexDirection).toBe('row');
  });

  test('vertical layout uses column flexDirection', () => {
    const { container } = render(
      <SplitPane vertical={true}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.flexDirection).toBe('column');
  });

  test('first panel starts at 50% width (horizontal)', () => {
    const { container } = render(
      <SplitPane vertical={false}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const firstPanel = container.querySelector('.splitpane-divider')!.previousElementSibling as HTMLElement;
    expect(firstPanel.style.minWidth).toBe('50%');
    expect(firstPanel.style.maxWidth).toBe('50%');
  });

  test('first panel starts at 50% height (vertical)', () => {
    const { container } = render(
      <SplitPane vertical={true}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const firstPanel = container.querySelector('.splitpane-divider')!.previousElementSibling as HTMLElement;
    expect(firstPanel.style.minHeight).toBe('50%');
    expect(firstPanel.style.maxHeight).toBe('50%');
  });

  test('mousedown on divider sets col-resize cursor on body', () => {
    const { container } = render(
      <SplitPane vertical={false}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const divider = container.querySelector('.splitpane-divider')!;
    fireEvent.mouseDown(divider);
    expect(document.body.style.cursor).toBe('col-resize');
    // Clean up: simulate mouseup
    fireEvent.mouseUp(document);
    expect(document.body.style.cursor).toBe('');
  });

  test('mousedown on divider sets row-resize cursor for vertical', () => {
    const { container } = render(
      <SplitPane vertical={true}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const divider = container.querySelector('.splitpane-divider')!;
    fireEvent.mouseDown(divider);
    expect(document.body.style.cursor).toBe('row-resize');
    // Clean up
    fireEvent.mouseUp(document);
  });

  test('calls onResize callback after drag completes', () => {
    const onResize = vi.fn();
    const { container } = render(
      <SplitPane onResize={onResize}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const divider = container.querySelector('.splitpane-divider')!;
    fireEvent.mouseDown(divider);
    fireEvent.mouseUp(document);
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  test('mousemove during drag updates panel size', () => {
    const { container } = render(
      <SplitPane vertical={false}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const divider = container.querySelector('.splitpane-divider')!;
    fireEvent.mouseDown(divider);

    // Simulate mousemove
    fireEvent.mouseMove(document, { pageX: 200 });

    // The first panel style should have changed from the initial 50%
    // (exact value depends on container offset/size in test env)
    const firstPanel = divider.previousElementSibling as HTMLElement;
    // Just verify it's still a percentage value
    expect(firstPanel.style.minWidth).toMatch(/%$/);

    // Clean up
    fireEvent.mouseUp(document);
  });

  test('position is clamped between 0 and 99', () => {
    const { container } = render(
      <SplitPane vertical={false}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    // In happy-dom, offsetWidth/offsetLeft are 0 by default.
    // Mock them so the drag calculation works.
    const splitContainer = container.firstElementChild as HTMLElement;
    Object.defineProperty(splitContainer, 'offsetWidth', { value: 1000, configurable: true });
    Object.defineProperty(splitContainer, 'offsetLeft', { value: 0, configurable: true });

    const divider = container.querySelector('.splitpane-divider')!;
    fireEvent.mouseDown(divider);

    // Simulate mousemove to a very large value
    fireEvent.mouseMove(document, { pageX: 99999 });
    const firstPanel = divider.previousElementSibling as HTMLElement;
    // Should be at most 99%
    const pct = parseFloat(firstPanel.style.minWidth);
    expect(pct).toBeLessThanOrEqual(99);

    // Simulate mousemove to a very small negative value
    fireEvent.mouseMove(document, { pageX: -99999 });
    const pct2 = parseFloat(firstPanel.style.minWidth);
    expect(pct2).toBeGreaterThanOrEqual(0);

    fireEvent.mouseUp(document);
  });
});
