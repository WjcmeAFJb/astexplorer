/** @typedef {import('../types').SnippetData} SnippetData */

import React from 'react';
import api from './api';
import {getParserByID} from '../parsers';

/**
 * @returns {{id: string, rev: string | undefined} | null}
 */
function getIDAndRevisionFromHash() {
  let match = global.location.hash.match(/^#\/gist\/([^/]+)(?:\/([^/]+))?/);
  if (match) {
    return {
      id: match[1],
      rev: match[2],
    };
  }
  return null;
}

/**
 * @param {string} snippetID
 * @param {string} [revisionID='latest']
 * @returns {Promise<Revision>}
 */
function fetchSnippet(snippetID, revisionID='latest') {
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
  .then(/** @param {GistData} response */ response => new Revision(response));
}

/**
 * @param {unknown} snippet
 * @returns {boolean}
 */
export function owns(snippet) {
  return snippet instanceof Revision;
}

/**
 * @returns {boolean}
 */
export function matchesURL() {
  return getIDAndRevisionFromHash() !== null;
}

/**
 * @returns {Promise<Revision | null>}
 */
export function fetchFromURL() {
  const data = getIDAndRevisionFromHash();
  if (!data) {
    return Promise.resolve(null);
  }
  return fetchSnippet(data.id, data.rev);
}

/**
 * Create a new snippet.
 * @param {SnippetData} data
 * @returns {Promise<Revision>}
 */
export function create(data) {
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
  .then(/** @param {GistData} data */ data => new Revision(data));
}

/**
 * Update an existing snippet.
 * @param {Revision} revision
 * @param {SnippetData} data
 * @returns {Promise<Revision>}
 */
export function update(revision, data) {
  // Fetch latest version of snippet
  return fetchSnippet(revision.getSnippetID())
    .then(latestRevision => {
      if (latestRevision.getTransformerID() && !data.toolID) {
        // Revision was updated to *remove* the transformer, hence we have
        // to signal the server to delete the transform.js file
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
      .then(/** @param {GistData} data */ data => new Revision(data));
    });
}

/**
 * Fork existing snippet.
 * @param {Revision} revision
 * @param {SnippetData} data
 * @returns {Promise<Revision>}
 */
export function fork(revision, data) {
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
  .then(/** @param {GistData} data */ data => new Revision(data));
}

/**
 * @typedef {Object} GistFile
 * @property {string} content
 */

/**
 * @typedef {Object} GistHistoryEntry
 * @property {string} version
 */

/**
 * @typedef {Object} GistData
 * @property {string} id
 * @property {Record<string, GistFile>} files
 * @property {GistHistoryEntry[]} history
 */

/**
 * @typedef {Object} GistConfig
 * @property {number} [v]
 * @property {string} parserID
 * @property {string} [toolID]
 * @property {Record<string, Record<string, unknown>>} settings
 */

class Revision {
  /**
   * @param {GistData} gist
   */
  constructor(gist) {
    this._gist = gist;
    this._config = /** @type {GistConfig} */ (JSON.parse(gist.files['astexplorer.json'].content));
  }

  /** @returns {boolean} */
  canSave() {
    return true;
  }

  /** @returns {string} */
  getPath() {
    return `/gist/${this.getSnippetID()}/${this.getRevisionID()}`;
  }

  /** @returns {string} */
  getSnippetID() {
    return this._gist.id;
  }

  /** @returns {string} */
  getRevisionID() {
    return this._gist.history[0].version;
  }

  /** @returns {string | undefined} */
  getTransformerID() {
    return this._config.toolID;
  }

  /** @returns {string} */
  getTransformCode() {
    const transformFile = this._gist.files['transform.js'];
    return transformFile ? transformFile.content : '';
  }

  /** @returns {string} */
  getParserID() {
    return this._config.parserID;
  }

  /** @returns {string} */
  getCode() {
    if (this._code == null) {
      this._code = getSource(this._config, this._gist) || '';
    }
    return this._code;
  }

  /** @returns {Record<string, unknown> | undefined} */
  getParserSettings() {
    return this._config.settings[this._config.parserID];
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

/**
 * @param {GistConfig} config
 * @param {GistData} gist
 * @returns {string | undefined}
 */
function getSource(config, gist) {
  switch (config.v) {
    case 1:
      return gist.files['code.js'].content;
    case 2: {
      const ext = getParserByID(config.parserID).category.fileExtension;
      return gist.files[`source.${ext}`].content;
    }
  }
}
