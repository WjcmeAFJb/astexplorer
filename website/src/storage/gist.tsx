import React from 'react';
import api from './api';
import {getParserByID} from 'astexplorer-parsers';
import type {SnippetData, Revision as RevisionType} from '../types';

function getIDAndRevisionFromHash(): {id: string, rev: string | undefined} | null {
  const match = window.location.hash.match(/^#\/gist\/([^/]+)(?:\/([^/]+))?/);
  if (match !== null) {
    return {
      id: match[1],
      rev: match[2],
    };
  }
  return null;
}

function isGistConfig(value: unknown): value is GistConfig {
  if (typeof value !== 'object' || value === null) return false;
  return 'parserID' in value && 'settings' in value;
}

function isGistData(value: unknown): value is GistData {
  if (typeof value !== 'object' || value === null) return false;
  return 'id' in value && 'files' in value && 'history' in value;
}

function asGistData(value: unknown): GistData {
  if (isGistData(value)) return value;
  throw new Error('Invalid gist data');
}

function fetchSnippet(snippetID: string, revisionID?: string): Promise<Revision> {
  return api(
    `/gist/${snippetID}` + (revisionID === undefined ? '' : `/${revisionID}`),
    {
      method: 'GET',
    },
  )
  .then(async response => {
    if (response.ok) {
      const json: unknown = await response.json();
      return asGistData(json);
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

export function owns(snippet: RevisionType): boolean {
  return snippet instanceof Revision;
}

export function matchesURL(): boolean {
  return getIDAndRevisionFromHash() !== null;
}

export function fetchFromURL(): Promise<Revision | null> {
  const data = getIDAndRevisionFromHash();
  if (data === null) {
    return Promise.resolve(null);
  }
  return fetchSnippet(data.id, data.rev);
}

/**

 * Create a new snippet.
 */
export function create(snippetData: SnippetData): Promise<Revision> {
  return api(
    '/gist',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snippetData),
    },
  )
  .then(async response => {
    if (response.ok) {
      const json: unknown = await response.json();
      return asGistData(json);
    }
    throw new Error('Unable to create snippet.');
  })
  .then((gistData: GistData) => new Revision(gistData));
}

/**

 * Update an existing snippet.
 */
export function update(revision: RevisionType, snippetData: SnippetData): Promise<Revision> {
  // Fetch latest version of snippet
  return fetchSnippet(revision.getSnippetID())
    .then(latestRevision => {
      if (latestRevision.getTransformerID() !== undefined && (snippetData.toolID === undefined || snippetData.toolID === '')) {
        // Revision was updated to *remove* the transformer, hence we have
        // to signal the server to delete the transform.js file
        snippetData.transform = null;
      }
      return api(
        `/gist/${revision.getSnippetID()}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(snippetData),
        },
      )
      .then(async response => {
        if (response.ok) {
          const json: unknown = await response.json();
          return asGistData(json);
        }
        throw new Error('Unable to update snippet.');
      })
      .then((gistData: GistData) => new Revision(gistData));
    });
}

/**

 * Fork existing snippet.
 */
export function fork(revision: RevisionType, snippetData: SnippetData): Promise<Revision> {
  return api(
    `/gist/${revision.getSnippetID()}/${revision.getRevisionID()}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snippetData),
    },
  )
  .then(async response => {
    if (response.ok) {
      const json: unknown = await response.json();
      return asGistData(json);
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
  _code: string | null = null;

    constructor(gist: GistData) {
    this._gist = gist;
    const parsed: unknown = JSON.parse(gist.files['astexplorer.json'].content);
    if (typeof parsed !== 'object' || parsed === null || !('parserID' in parsed) || !('settings' in parsed)) {
      throw new Error('Invalid gist config');
    }
    if (!isGistConfig(parsed)) {
      throw new Error('Invalid gist config');
    }
    this._config = parsed;
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
    const transformFile: GistFile | undefined = this._gist.files['transform.js'];
    return transformFile === undefined ? '' : transformFile.content;
  }

  getParserID(): string {
    return this._config.parserID;
  }

  getCode(): string {
    this._code ??= getSource(this._config, this._gist) ?? '';
    return this._code;
  }

  getParserSettings(): Record<string, unknown> | null {
    return this._config.settings[this._config.parserID] ?? null;
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
  if (config.v === 1) {
    return gist.files['code.js'].content;
  }
  if (config.v === 2) {
    const ext = getParserByID(config.parserID).category.fileExtension;
    return gist.files[`source.${ext}`].content;
  }
  return undefined;
}
