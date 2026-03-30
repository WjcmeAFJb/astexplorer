import React from 'react';
import api from './api';
import {getTransformerByID, getParserByID} from '../parsers';

/**
 * @returns {{id: string, rev: string | number} | null}
 */
function getIDAndRevisionFromHash() {
  let match = global.location.hash.match(/^#\/(?!gist\/)([^/]+)(?:\/(latest|\d*))?/);
  if (match) {
    return {
      id: match[1],
      rev: match[2] || 0,
    };
  }
  return null;
}

function fetchSnippet(snippetID: string, revisionID?: string | number): Promise<Revision> {
  return api(`/parse/${snippetID}/${revisionID}`)
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
  const newHash = '/' + revision.getSnippetID() + (rev && rev !== 0 ? '/' + rev : '');
  global.location.hash = newHash;
}

/**
 * @returns {Promise<Revision | null>}
 */
export function fetchFromURL() {
  const urlParameters = getIDAndRevisionFromHash();
  if (urlParameters) {
    return fetchSnippet(urlParameters.id, urlParameters.rev);
  }
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

  /** @returns {boolean} */
  canSave() {
    return false;
  }

  /** @returns {string} */
  getPath() {
    const rev = this.getRevisionID();
    return '/' + this.getSnippetID() + (rev && rev !== 0 ? '/' + rev : '');
  }

  /** @returns {string} */
  getSnippetID() {
    return this._data.snippetID;
  }

  /** @returns {string | number} */
  getRevisionID() {
    return this._data.revisionID;
  }

  /** @returns {string | undefined} */
  getTransformerID() {
    const transformerID = this._data.toolID;
    if (!transformerID && this.getTransformCode()) {
      // jscodeshift was the first transformer tool. Instead of updating
      // existing rows in the DB, we hardcode the value here
      return 'jscodeshift';
    }
    return transformerID;
  }

  /** @returns {string} */
  getTransformCode() {
    const transform = this._data.transform;
    if (transform) {
      return transform;
    }
    if (this._data.toolID) {
      // Default transforms where never stored
      return getTransformerByID(this._data.toolID).defaultTransform;
    }
    return '';
  }

  /** @returns {string} */
  getParserID() {
    const transformerID = this.getTransformerID();
    if (transformerID) {
      return getTransformerByID(transformerID).defaultParserID;
    }
    return this._data.parserID;
  }

  /** @returns {string} */
  getCode() {
    const parserID = this.getParserID();
    // Code examples where never stored
    return this._data.code || getParserByID(parserID).category.codeExample;
  }

  /** @returns {Record<string, unknown> | false | null} */
  getParserSettings() {
    const settings = this._data.settings;
    if (!settings) {
      return null;
    }
    const parserSettings = settings[this.getParserID()];
    return !!parserSettings && (JSON.parse(parserSettings) as Record<string, unknown>);
  }

  /** @returns {React.ReactElement} */
  getShareInfo() {
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
