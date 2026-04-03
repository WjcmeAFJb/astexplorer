/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import ReactDOM from 'react-dom';
import { Simulate } from 'react-dom/test-utils';

vi.mock('astexplorer-parsers', () => ({
  categories: [
    { id: 'javascript', displayName: 'JavaScript', mimeTypes: ['text/javascript'],
      parsers: [
        { id: 'acorn', showInMenu: true, displayName: 'acorn', hasSettings: () => false },
        { id: 'esprima', showInMenu: true, displayName: 'esprima', hasSettings: () => true },
        { id: 'hidden', showInMenu: false, displayName: 'hidden', hasSettings: () => false },
      ],
      transformers: [
        { id: 'babel', showInMenu: true, displayName: 'babel', defaultParserID: 'acorn', defaultTransform: '' },
        { id: 'jscodeshift', showInMenu: true, displayName: 'jscodeshift', defaultParserID: 'acorn', defaultTransform: '' },
      ],
    },
    { id: 'css', displayName: 'CSS', mimeTypes: ['text/css'],
      parsers: [{ id: 'cssom', showInMenu: true, displayName: 'cssom', hasSettings: () => false }],
      transformers: [],
    },
  ],
  getCategoryByID: (id: string) => ({
    id, displayName: id,
    parsers: [{ id: 'acorn', showInMenu: true, displayName: 'acorn', hasSettings: () => false }],
    transformers: [],
  }),
  getParserByID: (id: string) => ({ id, displayName: id }),
  getTransformerByID: (id: string) => (id ? { id, displayName: id } : undefined),
}));

import CategoryButton from '../src/components/buttons/CategoryButton';
import ParserButton from '../src/components/buttons/ParserButton';
import TransformButton from '../src/components/buttons/TransformButton';
import KeyMapButton from '../src/components/buttons/KeyMapButton';
import SnippetButton from '../src/components/buttons/SnippetButton';
import Toolbar from '../src/components/Toolbar';
import GistBanner from '../src/components/GistBanner';

function renderToDiv(el: React.ReactElement): HTMLDivElement {
  const div = document.createElement('div');
  document.body.appendChild(div);
  ReactDOM.render(el, div);
  return div;
}

const { categories } = require('astexplorer-parsers');
const jsCat = categories[0];
const cssCat = categories[1];

describe('CategoryButton', () => {
  test('renders current category name', () => {
    const div = renderToDiv(<CategoryButton category={jsCat} onCategoryChange={() => {}} />);
    expect(div.textContent).toContain('JavaScript');
  });

  test('renders all categories in dropdown', () => {
    const div = renderToDiv(<CategoryButton category={jsCat} onCategoryChange={() => {}} />);
    const items = div.querySelectorAll('li');
    expect(items.length).toBe(2); // JS and CSS
  });

  test('calls onCategoryChange when category clicked', () => {
    const onChange = vi.fn();
    const div = renderToDiv(<CategoryButton category={jsCat} onCategoryChange={onChange} />);
    const item = div.querySelector('li[data-id="css"]')!;
    Simulate.click(item);
    expect(onChange).toHaveBeenCalled();
  });
});

describe('ParserButton', () => {
  test('renders current parser name', () => {
    const parser = jsCat.parsers[0];
    const div = renderToDiv(
      <ParserButton parser={parser} category={jsCat} onParserChange={() => {}} onParserSettingsButtonClick={() => {}} />,
    );
    expect(div.textContent).toContain(parser.displayName);
  });

  test('only shows parsers with showInMenu', () => {
    const div = renderToDiv(
      <ParserButton parser={jsCat.parsers[0]} category={jsCat} onParserChange={() => {}} onParserSettingsButtonClick={() => {}} />,
    );
    const items = div.querySelectorAll('li');
    // acorn and esprima have showInMenu=true, hidden does not
    expect(items.length).toBe(jsCat.parsers.filter((p: any) => p.showInMenu).length);
  });

  test('settings button disabled when parser has no settings', () => {
    const div = renderToDiv(
      <ParserButton parser={jsCat.parsers[0]} category={jsCat} onParserChange={() => {}} onParserSettingsButtonClick={() => {}} />,
    );
    const buttons = div.querySelectorAll('button');
    const settingsBtn = buttons[buttons.length - 1];
    expect(settingsBtn.disabled).toBe(true);
  });

  test('settings button enabled when parser has settings', () => {
    const div = renderToDiv(
      <ParserButton parser={jsCat.parsers[1]} category={jsCat} onParserChange={() => {}} onParserSettingsButtonClick={() => {}} />,
    );
    const buttons = div.querySelectorAll('button');
    const settingsBtn = buttons[buttons.length - 1];
    expect(settingsBtn.disabled).toBe(false);
  });

  test('calls onParserChange when parser clicked', () => {
    const onChange = vi.fn();
    const div = renderToDiv(
      <ParserButton parser={jsCat.parsers[0]} category={jsCat} onParserChange={onChange} onParserSettingsButtonClick={() => {}} />,
    );
    const firstItem = div.querySelector('li')!;
    Simulate.click(firstItem);
    expect(onChange).toHaveBeenCalled();
  });
});

describe('TransformButton', () => {
  test('renders Transform text', () => {
    const div = renderToDiv(
      <TransformButton category={jsCat} transformer={null} showTransformer={false} onTransformChange={() => {}} />,
    );
    expect(div.textContent).toContain('Transform');
  });

  test('toggle off hides transformer', () => {
    const onChange = vi.fn();
    const div = renderToDiv(
      <TransformButton category={jsCat} transformer={jsCat.transformers[0]} showTransformer={true} onTransformChange={onChange} />,
    );
    // Click toggle button (first button)
    Simulate.click(div.querySelector('button')!);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  test('disabled when no transformers available', () => {
    const div = renderToDiv(
      <TransformButton category={cssCat} transformer={null} showTransformer={false} onTransformChange={() => {}} />,
    );
    expect(div.querySelector('button')!.disabled).toBe(true);
  });

  test('shows selected transformer with class', () => {
    const div = renderToDiv(
      <TransformButton category={jsCat} transformer={jsCat.transformers[0]} showTransformer={true} onTransformChange={() => {}} />,
    );
    const selected = div.querySelector('.selected');
    expect(selected).toBeTruthy();
  });

  test('lists transformers in dropdown', () => {
    const div = renderToDiv(
      <TransformButton category={jsCat} transformer={null} showTransformer={false} onTransformChange={() => {}} />,
    );
    const items = div.querySelectorAll('li');
    expect(items.length).toBe(jsCat.transformers.length);
  });

  test('clicking transformer in dropdown calls onTransformChange', () => {
    const onChange = vi.fn();
    const div = renderToDiv(
      <TransformButton category={jsCat} transformer={null} showTransformer={false} onTransformChange={onChange} />,
    );
    // Click the button inside the first <li> (a transformer)
    const firstLiButton = div.querySelector('li button') as HTMLButtonElement;
    expect(firstLiButton).toBeTruthy();
    Simulate.click(firstLiButton);
    expect(onChange).toHaveBeenCalled();
  });

  test('clicking li element in dropdown also calls onTransformChange', () => {
    const onChange = vi.fn();
    const div = renderToDiv(
      <TransformButton category={jsCat} transformer={null} showTransformer={false} onTransformChange={onChange} />,
    );
    // Click on the <li> itself (not the button)
    const firstLi = div.querySelector('li') as HTMLLIElement;
    expect(firstLi).toBeTruthy();
    Simulate.click(firstLi);
    expect(onChange).toHaveBeenCalled();
  });
});

describe('KeyMapButton', () => {
  test('renders current keymap', () => {
    const div = renderToDiv(<KeyMapButton keyMap="vim" onKeyMapChange={() => {}} />);
    expect(div.textContent).toContain('vim');
  });

  test('lists all keymaps', () => {
    const div = renderToDiv(<KeyMapButton keyMap="default" onKeyMapChange={() => {}} />);
    const items = div.querySelectorAll('li');
    expect(items.length).toBe(4); // default, vim, emacs, sublime
  });

  test('calls onKeyMapChange when clicked', () => {
    const onChange = vi.fn();
    const div = renderToDiv(<KeyMapButton keyMap="default" onKeyMapChange={onChange} />);
    const vimItem = Array.from(div.querySelectorAll('li')).find(li => li.textContent === 'vim')!;
    Simulate.click(vimItem);
    expect(onChange).toHaveBeenCalledWith('vim');
  });
});

describe('SnippetButton', () => {
  test('renders Snippet text', () => {
    const div = renderToDiv(
      <SnippetButton canSave={false} canFork={false} saving={false} forking={false}
        onSave={() => {}} onFork={() => {}} onNew={() => {}} snippet={null} onShareButtonClick={() => {}} />,
    );
    expect(div.textContent).toContain('Snippet');
  });

  test('quick button shows save icon when canSave', () => {
    const div = renderToDiv(
      <SnippetButton canSave={true} canFork={false} saving={false} forking={false}
        onSave={() => {}} onFork={() => {}} onNew={() => {}} snippet={null} onShareButtonClick={() => {}} />,
    );
    // The quick-action button (last button in the div)
    const buttons = div.querySelectorAll('button');
    const quickBtn = div.querySelector('.menuButton > button[title]')!;
    expect(quickBtn.getAttribute('title')).toBe('Save');
  });

  test('quick button shows fork icon when canFork but not canSave', () => {
    const div = renderToDiv(
      <SnippetButton canSave={false} canFork={true} saving={false} forking={false}
        onSave={() => {}} onFork={() => {}} onNew={() => {}} snippet={null} onShareButtonClick={() => {}} />,
    );
    const quickBtn = div.querySelector('.menuButton > button[title]')!;
    expect(quickBtn.getAttribute('title')).toBe('Fork');
  });

  test('quick button disabled when nothing to do', () => {
    const div = renderToDiv(
      <SnippetButton canSave={false} canFork={false} saving={false} forking={false}
        onSave={() => {}} onFork={() => {}} onNew={() => {}} snippet={null} onShareButtonClick={() => {}} />,
    );
    const quickBtn = div.querySelector('.menuButton > button[title]') as HTMLButtonElement;
    expect(quickBtn.disabled).toBe(true);
  });

  test('spinner shows when saving', () => {
    const div = renderToDiv(
      <SnippetButton canSave={true} canFork={false} saving={true} forking={false}
        onSave={() => {}} onFork={() => {}} onNew={() => {}} snippet={null} onShareButtonClick={() => {}} />,
    );
    expect(div.querySelector('.fa-spinner')).toBeTruthy();
  });
});

describe('Toolbar', () => {
  test('renders parser info with version and link', () => {
    const parser = { displayName: 'acorn', version: '8.7.0', homepage: 'https://github.com/acornjs/acorn', category: jsCat, hasSettings: () => false };
    const div = renderToDiv(
      <Toolbar parser={parser} category={jsCat} transformer={null} showTransformer={false}
        onParserChange={() => {}} onCategoryChange={() => {}} onTransformChange={() => {}}
        onParserSettingsButtonClick={() => {}} onShareButtonClick={() => {}} onKeyMapChange={() => {}}
        onSave={() => {}} onFork={() => {}} onNew={() => {}} saving={false} forking={false}
        canSave={false} canFork={false} keyMap="default" snippet={null} />,
    );
    expect(div.textContent).toContain('acorn');
    const link = div.querySelector('a[href="https://github.com/acornjs/acorn"]');
    expect(link).toBeTruthy();
    expect(link!.textContent).toContain('8.7.0');
  });

  test('renders transformer info when shown', () => {
    const parser = { displayName: 'acorn', category: jsCat, hasSettings: () => false };
    const transformer = { displayName: 'babel', version: '7.0', homepage: 'https://babeljs.io' };
    const div = renderToDiv(
      <Toolbar parser={parser} category={jsCat} transformer={transformer} showTransformer={true}
        onParserChange={() => {}} onCategoryChange={() => {}} onTransformChange={() => {}}
        onParserSettingsButtonClick={() => {}} onShareButtonClick={() => {}} onKeyMapChange={() => {}}
        onSave={() => {}} onFork={() => {}} onNew={() => {}} saving={false} forking={false}
        canSave={false} canFork={false} keyMap="default" snippet={null} />,
    );
    expect(div.textContent).toContain('Transformer');
    expect(div.textContent).toContain('babel');
    expect(div.querySelector('a[href="https://babeljs.io"]')).toBeTruthy();
  });

  test('renders AST Explorer heading', () => {
    const parser = { displayName: 'acorn', category: jsCat, hasSettings: () => false };
    const div = renderToDiv(
      <Toolbar parser={parser} category={jsCat} transformer={null} showTransformer={false}
        onParserChange={() => {}} onCategoryChange={() => {}} onTransformChange={() => {}}
        onParserSettingsButtonClick={() => {}} onShareButtonClick={() => {}} onKeyMapChange={() => {}}
        onSave={() => {}} onFork={() => {}} onNew={() => {}} saving={false} forking={false}
        canSave={false} canFork={false} keyMap="default" snippet={null} />,
    );
    expect(div.querySelector('h1')!.textContent).toBe('AST Explorer');
  });
});
