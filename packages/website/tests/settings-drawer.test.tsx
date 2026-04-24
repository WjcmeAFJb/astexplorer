/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import SettingsDrawer from '../src/components/SettingsDrawer';

describe('SettingsDrawer', () => {
  test('renders collapsed state by default (isOpen=false)', () => {
    const { container } = render(
      <SettingsDrawer isOpen={false} onWantToExpand={() => {}} onWantToCollapse={() => {}} />,
    );
    expect(container.querySelector('.settings-drawer__collapsed')).not.toBeNull();
    expect(container.querySelector('.settings-drawer__expanded')).toBeNull();
  });

  test('renders expanded state when isOpen=true', () => {
    const { container } = render(
      <SettingsDrawer isOpen={true} onWantToExpand={() => {}} onWantToCollapse={() => {}} />,
    );
    expect(container.querySelector('.settings-drawer__expanded')).not.toBeNull();
    expect(container.querySelector('.settings-drawer__collapsed')).toBeNull();
  });

  test('shows Settings heading when open', () => {
    const { container } = render(
      <SettingsDrawer isOpen={true} onWantToExpand={() => {}} onWantToCollapse={() => {}} />,
    );
    expect(container.querySelector('h3')!.textContent).toBe('Settings');
  });

  test('shows Close button when open', () => {
    const { container } = render(
      <SettingsDrawer isOpen={true} onWantToExpand={() => {}} onWantToCollapse={() => {}} />,
    );
    const btn = container.querySelector('button')!;
    expect(btn.textContent).toBe('Close');
  });

  test('calls onWantToCollapse when Close button is clicked', () => {
    const onCollapse = vi.fn();
    const { container } = render(
      <SettingsDrawer isOpen={true} onWantToExpand={() => {}} onWantToCollapse={onCollapse} />,
    );
    fireEvent.click(container.querySelector('button')!);
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  test('calls onWantToExpand when collapsed area is clicked', () => {
    const onExpand = vi.fn();
    const { container } = render(
      <SettingsDrawer isOpen={false} onWantToExpand={onExpand} onWantToCollapse={() => {}} />,
    );
    fireEvent.click(container.querySelector('.settings-drawer__collapsed')!);
    expect(onExpand).toHaveBeenCalledTimes(1);
  });
});
