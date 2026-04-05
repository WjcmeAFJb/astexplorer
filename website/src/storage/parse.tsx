// oxlint-disable typescript-eslint/no-unsafe-type-assertion, typescript-eslint/prefer-nullish-coalescing, typescript-eslint/strict-boolean-expressions -- Parse API response is untyped
import React from 'react';
import api from './api';
import {getTransformerByID, getParserByID} from 'astexplorer-parsers';

/**
 * @returns {{id: string, rev: string | number} | null}
 */
function getIDAndRevisionFromHash() {
  const match = window.location.hash.match(/^#\/(?!gist\/)([^/]+)(?:\/(latest|\d*))?/);
  if (match !== null) {
    return {
      id: match[1],
      rev: match[2] ?? 0,
    };
  }
  // oxlint-disable-next-line unicorn/no-null -- return type is object | null; null means "no match found in URL"
  return null;
}

function fetchSnippet(snippetID: string, revisionID?: string | number): Promise<Revision> {
  return api(`/parse/${snippetID}/${revisionID}`)
    .then(response => {
      if (response.ok) {
        // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- response.json() returns Promise<any>; fetch API boundary
        return response.json() as Promise<ParseSnippetData>;
      }
      switch (response.status) {
        case 404:
          throw new Error(`Snippet with ID ${snippetID}/${revisionID} doesn't exist.`);
        default:
          throw new Error('Unknown error.');
      }
    })
    .then((response: ParseSnippetData) => new Revision(response));
}

export function owns(snippet: unknown): boolean {
  return snippet instanceof Revision;
}

/**
 * @returns {boolean}
 */
export function matchesURL() {
  return getIDAndRevisionFromHash() !== null;
}

export function updateHash(revision: Revision): void {
  const rev = revision.getRevisionID();
  const hasRev = rev !== undefined && rev !== '' && rev !== 0;
  const newHash = '/' + revision.getSnippetID() + (hasRev ? '/' + String(rev) : '');
  window.location.hash = newHash;
}

/**
 * @returns {Promise<Revision | null>}
 */
export function fetchFromURL() {
  const urlParameters = getIDAndRevisionFromHash();
  if (urlParameters !== null) {
    return fetchSnippet(urlParameters.id, urlParameters.rev);
  }
  // oxlint-disable-next-line unicorn/no-null -- fetchFromURL returns Promise<Revision | null>; null means "no snippet to load"
  return Promise.resolve(null);
}

/**
 * Create a new snippet.
 * @returns {Promise<never>}
 */
export function create() {
  return Promise.reject(
    new Error('Saving Parse snippets is not supported anymore.'),
  );
}

/**
 * Update an existing snippet.
 * @returns {Promise<never>}
 */
export function update() {
  return Promise.reject(
    new Error('Saving Parse snippets is not supported anymore.'),
  );
}

/**
 * Fork existing snippet.
 * @returns {Promise<never>}
 */
export function fork() {
  return Promise.reject(
    new Error('Saving Parse snippets is not supported anymore.'),
  );
}

type ParseSnippetData = {
  snippetID: string;
  revisionID: string | number;
  toolID?: string;
  transform?: string;
  parserID?: string;
  code?: string;
  settings?: Record<string, string>;
};

class Revision {
  _data: ParseSnippetData;

  	constructor(data: ParseSnippetData) {
    this._data = data;
	}

  canSave(): boolean {
    return false;
  }

  getPath(): string {
    const rev = this.getRevisionID();
    const hasRev = rev !== undefined && rev !== '' && rev !== 0;
    return '/' + this.getSnippetID() + (hasRev ? '/' + String(rev) : '');
  }

  getSnippetID(): string {
    return this._data.snippetID;
  }

  getRevisionID(): string | number {
    return this._data.revisionID;
  }

  getTransformerID(): string | undefined {
    const transformerID = this._data.toolID;
    if ((transformerID === undefined || transformerID === '') && this.getTransformCode() !== '') {
      // jscodeshift was the first transformer tool. Instead of updating
      // existing rows in the DB, we hardcode the value here
      return 'jscodeshift';
    }
    return transformerID;
  }

  getTransformCode(): string {
    const transform = this._data.transform;
    if (transform !== undefined && transform !== '') {
      return transform;
    }
    if (this._data.toolID !== undefined && this._data.toolID !== '') {
      // Default transforms where never stored
      return getTransformerByID(this._data.toolID).defaultTransform;
    }
    return '';
  }

  getParserID(): string {
    const transformerID = this.getTransformerID();
    if (transformerID !== undefined && transformerID !== '') {
      return getTransformerByID(transformerID).defaultParserID;
    }
    return this._data.parserID;
  }

  getCode(): string {
    const parserID = this.getParserID();
    // Code examples where never stored
    return this._data.code ?? getParserByID(parserID).category.codeExample;
  }

  getParserSettings(): Record<string, unknown> | false | null {
    const settings = this._data.settings;
    if (settings === undefined) {
      // oxlint-disable-next-line unicorn/no-null -- getParserSettings returns Record | false | null; null means "no settings available"
      return null;
    }
    const parserSettings = settings[this.getParserID()];
    if (parserSettings === undefined || parserSettings === '') {
      return false;
    }
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- JSON.parse returns unknown; server data is expected to be Record<string, unknown>
    return JSON.parse(parserSettings) as Record<string, unknown>;
  }

  getShareInfo(): React.ReactElement {
    const snippetID = this.getSnippetID();
    const revisionID = this.getRevisionID();
    return (
      <div className="shareInfo">
        <dl>
          <dt>Current Revision</dt>
          <dd>
            <input
              readOnly={true}
              onFocus={e => e.target.select()}
              value={`https://astexplorer.net/#/gist/${snippetID}/${revisionID}`}
            />
          </dd>
          <dt>Latest Revision</dt>
          <dd>
            <input
              readOnly={true}
              onFocus={e => e.target.select()}
              value={`https://astexplorer.net/#/gist/${snippetID}/latest`}
            />
          </dd>
        </dl>
      </div>
    );
  }
}
