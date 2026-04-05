// oxlint-disable typescript-eslint/no-unsafe-type-assertion, typescript-eslint/prefer-nullish-coalescing, typescript-eslint/strict-boolean-expressions -- legacy untyped code; full strict typing migration tracked as tech debt
import React from 'react';
import api from './api';
import {getParserByID} from 'astexplorer-parsers';
import type {SnippetData} from '../types';

function getIDAndRevisionFromHash(): {id: string, rev: string | undefined} | null {
  let match = window.location.hash.match(/^#\/gist\/([^/]+)(?:\/([^/]+))?/);
  if (match) {
    return {
      id: match[1],
      rev: match[2],
    };
  }
  // oxlint-disable-next-line unicorn/no-null -- return type is object | null; null means "no match found in URL"
  return null;
}

function fetchSnippet(snippetID: string, revisionID?: string): Promise<Revision> {
  return api(
    `/gist/${snippetID}` + (revisionID ? `/${revisionID}` : ''),
    {
      method: 'GET',
    },
  )
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    switch (response.status) {
      case 404:
        throw new Error(`Snippet with ID ${snippetID}/${revisionID} doesn't exist.`);
      default:
        throw new Error('Unknown error.');
    }
  })
  .then((response: GistData) => new Revision(response));
}

export function owns(snippet: unknown): boolean {
  return snippet instanceof Revision;
}

export function matchesURL(): boolean {
  return getIDAndRevisionFromHash() !== null;
}

export function fetchFromURL(): Promise<Revision | null> {
  const data = getIDAndRevisionFromHash();
  if (!data) {
    // oxlint-disable-next-line unicorn/no-null -- fetchFromURL returns Promise<Revision | null>; null means "no snippet to load"
    return Promise.resolve(null);
  }
  return fetchSnippet(data.id, data.rev);
}

/**

 * Create a new snippet.
 */
export function create(data: SnippetData): Promise<Revision> {
  return api(
    '/gist',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  )
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error('Unable to create snippet.');
  })
  .then((gistData: GistData) => new Revision(gistData));
}

/**

 * Update an existing snippet.
 */
export function update(revision: Revision, data: SnippetData): Promise<Revision> {
  // Fetch latest version of snippet
  return fetchSnippet(revision.getSnippetID())
    .then(latestRevision => {
      if (latestRevision.getTransformerID() && !data.toolID) {
        // Revision was updated to *remove* the transformer, hence we have
        // to signal the server to delete the transform.js file
        // oxlint-disable-next-line unicorn/no-null -- SnippetData.transform is string | null; null signals the server to delete the transform file
        data.transform = null;
      }
      return api(
        `/gist/${revision.getSnippetID()}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      )
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Unable to update snippet.');
      })
      .then((gistData: GistData) => new Revision(gistData));
    });
}

/**

 * Fork existing snippet.
 */
export function fork(revision: Revision, data: SnippetData): Promise<Revision> {
  return api(
    `/gist/${revision.getSnippetID()}/${revision.getRevisionID()}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  )
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error('Unable to fork snippet.');
  })
  .then((gistData: GistData) => new Revision(gistData));
}

type GistFile = {
  content: string;
};

type GistHistoryEntry = {
  version: string;
};

type GistData = {
  id: string;
  files: Record<string, GistFile>;
  history: GistHistoryEntry[];
};

type GistConfig = {
  v?: number;
  parserID: string;
  toolID?: string;
  settings: Record<string, Record<string, unknown>>;
};

class Revision {
  _gist: GistData;
  _config: GistConfig;
  // oxlint-disable-next-line unicorn/no-null -- _code is string | null; null means "not yet computed"
  _code: string | null = null;

    constructor(gist: GistData) {
    this._gist = gist;
    this._config = (JSON.parse(gist.files['astexplorer.json'].content) as GistConfig);
  }

  canSave(): boolean {
    return true;
  }

  getPath(): string {
    return `/gist/${this.getSnippetID()}/${this.getRevisionID()}`;
  }

  getSnippetID(): string {
    return this._gist.id;
  }

  getRevisionID(): string {
    return this._gist.history[0].version;
  }

  getTransformerID(): string | undefined {
    return this._config.toolID;
  }

  getTransformCode(): string {
    const transformFile = this._gist.files['transform.js'];
    return transformFile ? transformFile.content : '';
  }

  getParserID(): string {
    return this._config.parserID;
  }

  getCode(): string {
    if (this._code === null || this._code === undefined) {
      this._code = getSource(this._config, this._gist) || '';
    }
    return this._code;
  }

  getParserSettings(): Record<string, unknown> | undefined {
    return this._config.settings[this._config.parserID];
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
          <dt>Gist</dt>
          <dd>
            <input
              readOnly={true}
              onFocus={e => e.target.select()}
              value={`https://gist.github.com/${snippetID}/${revisionID}`}
            />
          </dd>
        </dl>
      </div>
    );
  }
}

function getSource(config: GistConfig, gist: GistData): string | undefined {
  // oxlint-disable-next-line typescript-eslint/switch-exhaustiveness-check -- config.v is a number; only v1 and v2 are known gist formats, default handles future versions
  switch (config.v) {
    case 1:
      return gist.files['code.js'].content;
    case 2: {
      const ext = getParserByID(config.parserID).category.fileExtension;
      return gist.files[`source.${ext}`].content;
    }
    default:
      return undefined;
  }
}
