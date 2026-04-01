/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import ReactDOM from 'react-dom';

vi.mock('astexplorer-parsers', () => ({
  categories: [
    { id: 'javascript', displayName: 'JavaScript', parsers: [{ id: 'acorn', showInMenu: true, displayName: 'acorn', hasSettings: () => false }], transformers: [] },
    { id: 'css', displayName: 'CSS', parsers: [{ id: 'cssom', showInMenu: true, displayName: 'cssom', hasSettings: () => false }], transformers: [] },
  ],
  getCategoryByID: (id: string) => ({
    id, displayName: id,
    parsers: [{ id: 'acorn', showInMenu: true, displayName: 'acorn', hasSettings: () => false }],
    transformers: [],
  }),
  getParserByID: (id: string) => ({ id, displayName: id }),
  getTransformerByID: (id: string) => (id ? { id, displayName: id } : undefined),
}));

import ErrorMessage from '../src/components/ErrorMessage';
import LoadingIndicator from '../src/components/LoadingIndicator';
import SaveButton from '../src/components/buttons/SaveButton';
import ForkButton from '../src/components/buttons/ForkButton';
import NewButton from '../src/components/buttons/NewButton';
import ShareButton from '../src/components/buttons/ShareButton';
import PrettierButton from '../src/components/buttons/PrettierButton';

function renderToDiv(el: React.ReactElement): HTMLDivElement {
  const div = document.createElement('div');
  ReactDOM.render(el, div);
  return div;
}

describe('ErrorMessage', () => {
  test('renders nothing when no error', () => {
    const div = renderToDiv(<ErrorMessage error={null} />);
    expect(div.innerHTML).toBe('');
  });

  test('renders error message', () => {
    const div = renderToDiv(<ErrorMessage error={new Error('Something failed')} onWantToClose={() => {}} />);
    expect(div.textContent).toContain('Something failed');
    expect(div.textContent).toContain('Error');
  });

  test('OK button calls onWantToClose', () => {
    const onClose = vi.fn();
    const div = renderToDiv(<ErrorMessage error={new Error('x')} onWantToClose={onClose} />);
    require('react-dom/test-utils').Simulate.click(div.querySelector('button')!);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('LoadingIndicator', () => {
  test('renders spinner when visible', () => {
    const div = renderToDiv(<LoadingIndicator visible={true} />);
    expect(div.querySelector('.loadingIndicator')).toBeTruthy();
  });

  test('renders nothing when not visible', () => {
    const div = renderToDiv(<LoadingIndicator visible={false} />);
    expect(div.innerHTML).toBe('');
  });
});

describe('SaveButton', () => {
  test('enabled when canSave and not saving/forking', () => {
    const onSave = vi.fn();
    const div = renderToDiv(<SaveButton canSave={true} saving={false} forking={false} onSave={onSave} />);
    const btn = div.querySelector('button')!;
    expect(btn.disabled).toBe(false);
    require('react-dom/test-utils').Simulate.click(btn);
    expect(onSave).toHaveBeenCalled();
  });

  test('disabled when saving', () => {
    const div = renderToDiv(<SaveButton canSave={true} saving={true} forking={false} onSave={() => {}} />);
    expect(div.querySelector('button')!.disabled).toBe(true);
  });

  test('disabled when forking', () => {
    const div = renderToDiv(<SaveButton canSave={true} saving={false} forking={true} onSave={() => {}} />);
    expect(div.querySelector('button')!.disabled).toBe(true);
  });

  test('disabled when canSave=false', () => {
    const div = renderToDiv(<SaveButton canSave={false} saving={false} forking={false} onSave={() => {}} />);
    expect(div.querySelector('button')!.disabled).toBe(true);
  });

  test('shows spinner when saving', () => {
    const div = renderToDiv(<SaveButton canSave={true} saving={true} forking={false} onSave={() => {}} />);
    expect(div.querySelector('.fa-spinner')).toBeTruthy();
  });

  test('shows floppy when not saving', () => {
    const div = renderToDiv(<SaveButton canSave={true} saving={false} forking={false} onSave={() => {}} />);
    expect(div.querySelector('.fa-floppy-o')).toBeTruthy();
  });
});

describe('ForkButton', () => {
  test('enabled when canFork', () => {
    const onFork = vi.fn();
    const div = renderToDiv(<ForkButton canFork={true} saving={false} forking={false} onFork={onFork} />);
    const btn = div.querySelector('button')!;
    expect(btn.disabled).toBe(false);
    require('react-dom/test-utils').Simulate.click(btn);
    expect(onFork).toHaveBeenCalled();
  });

  test('disabled when forking', () => {
    const div = renderToDiv(<ForkButton canFork={true} saving={false} forking={true} onFork={() => {}} />);
    expect(div.querySelector('button')!.disabled).toBe(true);
  });

  test('shows spinner when forking', () => {
    const div = renderToDiv(<ForkButton canFork={true} forking={true} saving={false} onFork={() => {}} />);
    expect(div.querySelector('.fa-spinner')).toBeTruthy();
  });
});

describe('NewButton', () => {
  test('calls onNew when clicked', () => {
    const onNew = vi.fn();
    const div = renderToDiv(<NewButton saving={false} forking={false} onNew={onNew} />);
    require('react-dom/test-utils').Simulate.click(div.querySelector('button')!);
    expect(onNew).toHaveBeenCalled();
  });

  test('disabled when saving', () => {
    const div = renderToDiv(<NewButton saving={true} forking={false} onNew={() => {}} />);
    expect(div.querySelector('button')!.disabled).toBe(true);
  });
});

describe('ShareButton', () => {
  test('enabled when snippet exists', () => {
    const onClick = vi.fn();
    const div = renderToDiv(<ShareButton snippet={{ id: 'abc' }} onShareButtonClick={onClick} />);
    const btn = div.querySelector('button')!;
    expect(btn.disabled).toBe(false);
    require('react-dom/test-utils').Simulate.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  test('disabled when no snippet', () => {
    const div = renderToDiv(<ShareButton snippet={null} onShareButtonClick={() => {}} />);
    expect(div.querySelector('button')!.disabled).toBe(true);
  });
});

describe('PrettierButton', () => {
  test('shows toggle-on when enabled', () => {
    const div = renderToDiv(<PrettierButton enableFormatting={true} toggleFormatting={() => {}} />);
    expect(div.querySelector('.fa-toggle-on')).toBeTruthy();
  });

  test('shows toggle-off when disabled', () => {
    const div = renderToDiv(<PrettierButton enableFormatting={false} toggleFormatting={() => {}} />);
    expect(div.querySelector('.fa-toggle-off')).toBeTruthy();
  });

  test('calls toggleFormatting on click', () => {
    const toggle = vi.fn();
    const div = renderToDiv(<PrettierButton enableFormatting={false} toggleFormatting={toggle} />);
    require('react-dom/test-utils').Simulate.click(div.querySelector('button')!);
    expect(toggle).toHaveBeenCalled();
  });
});
