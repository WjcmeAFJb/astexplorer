/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import SettingsDialog from '../src/components/dialogs/SettingsDialog';
import ShareDialog from '../src/components/dialogs/ShareDialog';

describe('SettingsDialog', () => {
  const mockParser = {
    id: 'acorn',
    displayName: 'acorn',
    hasSettings: () => true,
    renderSettings: vi.fn((settings: Record<string, unknown>, onChange: (s: Record<string, unknown>) => void) => (
      <div data-testid="parser-settings">
        <label>
          JSX
          <input
            type="checkbox"
            checked={!!settings?.jsx}
            onChange={(e) => onChange({ ...settings, jsx: e.target.checked })}
          />
        </label>
      </div>
    )),
  };

  test('renders nothing when visible=false', () => {
    const { container } = render(
      <SettingsDialog
        visible={false}
        parser={mockParser}
        parserSettings={{}}
        onSave={() => {}}
        onWantToClose={() => {}}
      />,
    );
    expect(container.querySelector('#SettingsDialog')).toBeNull();
  });

  test('renders dialog when visible=true', () => {
    const { container } = render(
      <SettingsDialog
        visible={true}
        parser={mockParser}
        parserSettings={{}}
        onSave={() => {}}
        onWantToClose={() => {}}
      />,
    );
    expect(container.querySelector('#SettingsDialog')).not.toBeNull();
  });

  test('renders nothing when parser has no renderSettings', () => {
    const plainParser = {
      id: 'plain',
      displayName: 'plain',
      hasSettings: () => false,
      // no renderSettings
    };
    const { container } = render(
      <SettingsDialog
        visible={true}
        parser={plainParser as any}
        parserSettings={{}}
        onSave={() => {}}
        onWantToClose={() => {}}
      />,
    );
    expect(container.querySelector('#SettingsDialog')).toBeNull();
  });

  test('shows parser name in header', () => {
    const { container } = render(
      <SettingsDialog
        visible={true}
        parser={mockParser}
        parserSettings={{}}
        onSave={() => {}}
        onWantToClose={() => {}}
      />,
    );
    const header = container.querySelector('.header h3')!;
    expect(header.textContent).toBe('acorn Settings');
  });

  test('calls parser.renderSettings with parserSettings', () => {
    const settings = { jsx: true };
    render(
      <SettingsDialog
        visible={true}
        parser={mockParser}
        parserSettings={settings}
        onSave={() => {}}
        onWantToClose={() => {}}
      />,
    );
    expect(mockParser.renderSettings).toHaveBeenCalledWith(
      settings,
      expect.any(Function),
    );
  });

  test('has Reset and Close buttons in footer', () => {
    const { container } = render(
      <SettingsDialog
        visible={true}
        parser={mockParser}
        parserSettings={{}}
        onSave={() => {}}
        onWantToClose={() => {}}
      />,
    );
    const footerButtons = container.querySelectorAll('.footer button');
    expect(footerButtons.length).toBe(2);
    expect(footerButtons[0].textContent).toBe('Reset');
    expect(footerButtons[1].textContent).toBe('Close');
  });

  test('Reset button clears settings to empty object', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <SettingsDialog
        visible={true}
        parser={mockParser}
        parserSettings={{ jsx: true }}
        onSave={onSave}
        onWantToClose={onClose}
      />,
    );
    const resetBtn = container.querySelectorAll('.footer button')[0];
    fireEvent.click(resetBtn);

    // After reset, clicking Close should save with empty settings
    const closeBtn = container.querySelectorAll('.footer button')[1];
    fireEvent.click(closeBtn);
    expect(onSave).toHaveBeenCalledWith(mockParser, {});
    expect(onClose).toHaveBeenCalled();
  });

  test('Close button calls onSave and onWantToClose', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const settings = { jsx: true };
    const { container } = render(
      <SettingsDialog
        visible={true}
        parser={mockParser}
        parserSettings={settings}
        onSave={onSave}
        onWantToClose={onClose}
      />,
    );
    const closeBtn = container.querySelectorAll('.footer button')[1];
    fireEvent.click(closeBtn);
    expect(onSave).toHaveBeenCalledWith(mockParser, settings);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('updates internal state when parserSettings prop changes', () => {
    const onSave = vi.fn();
    const { rerender, container } = render(
      <SettingsDialog
        visible={true}
        parser={mockParser}
        parserSettings={{ jsx: false }}
        onSave={onSave}
        onWantToClose={() => {}}
      />,
    );
    rerender(
      <SettingsDialog
        visible={true}
        parser={mockParser}
        parserSettings={{ jsx: true }}
        onSave={onSave}
        onWantToClose={() => {}}
      />,
    );
    // Close to trigger save with the new settings
    const closeBtn = container.querySelectorAll('.footer button')[1];
    fireEvent.click(closeBtn);
    expect(onSave).toHaveBeenCalledWith(mockParser, { jsx: true });
  });

  test('clicking inner area does not close', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <SettingsDialog
        visible={true}
        parser={mockParser}
        parserSettings={{}}
        onSave={onSave}
        onWantToClose={onClose}
      />,
    );
    const inner = container.querySelector('.inner')!;
    fireEvent.click(inner);
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('onChange callback from renderSettings updates internal state', () => {
    const onSave = vi.fn();
    const { container } = render(
      <SettingsDialog
        visible={true}
        parser={mockParser}
        parserSettings={{ jsx: false }}
        onSave={onSave}
        onWantToClose={() => {}}
      />,
    );
    // The renderSettings mock renders a checkbox. Clicking it calls onChange.
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    fireEvent.click(checkbox);
    // The onChange should update internal state. Close to verify.
    const closeBtn = container.querySelectorAll('.footer button')[1];
    fireEvent.click(closeBtn);
    // The settings should reflect the checkbox change
    expect(onSave).toHaveBeenCalledWith(mockParser, expect.objectContaining({ jsx: true }));
  });
});

describe('ShareDialog', () => {
  const mockSnippet = {
    canSave: () => true,
    getSnippetID: () => 'abc123',
    getRevisionID: () => '1',
    getTransformerID: () => undefined,
    getTransformCode: () => '',
    getParserID: () => 'acorn',
    getCode: () => '',
    getParserSettings: () => null,
    getPath: () => '/abc123/1',
    getShareInfo: () => (
      <div data-testid="share-info">
        <p>Share this URL: https://astexplorer.net/#/abc123/1</p>
      </div>
    ),
  };

  test('renders nothing when visible=false', () => {
    const { container } = render(
      <ShareDialog visible={false} onWantToClose={() => {}} snippet={mockSnippet as any} />,
    );
    expect(container.querySelector('#ShareDialog')).toBeNull();
  });

  test('renders dialog when visible=true', () => {
    const { container } = render(
      <ShareDialog visible={true} onWantToClose={() => {}} snippet={mockSnippet as any} />,
    );
    expect(container.querySelector('#ShareDialog')).not.toBeNull();
  });

  test('renders share info from snippet', () => {
    const { container } = render(
      <ShareDialog visible={true} onWantToClose={() => {}} snippet={mockSnippet as any} />,
    );
    expect(container.querySelector('[data-testid="share-info"]')).not.toBeNull();
    expect(container.textContent).toContain('Share this URL');
  });

  test('has Close button in footer', () => {
    const { container } = render(
      <ShareDialog visible={true} onWantToClose={() => {}} snippet={mockSnippet as any} />,
    );
    const footerBtn = container.querySelector('.footer button')!;
    expect(footerBtn.textContent).toBe('Close');
  });

  test('Close button calls onWantToClose', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ShareDialog visible={true} onWantToClose={onClose} snippet={mockSnippet as any} />,
    );
    const closeBtn = container.querySelector('.footer button')!;
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('clicking inner area does not close', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ShareDialog visible={true} onWantToClose={onClose} snippet={mockSnippet as any} />,
    );
    const inner = container.querySelector('.inner')!;
    fireEvent.click(inner);
    expect(onClose).not.toHaveBeenCalled();
  });

  test('dialog has correct max-width and width style', () => {
    const { container } = render(
      <ShareDialog visible={true} onWantToClose={() => {}} snippet={mockSnippet as any} />,
    );
    const inner = container.querySelector('.inner') as HTMLElement;
    expect(inner.style.maxWidth).toBe('80%');
    expect(inner.style.width).toBe('600px');
  });

});
