/** @typedef {import('../types.js').StorageBackend} StorageBackend */
/** @typedef {import('../types.js').Revision} Revision */
/** @typedef {import('../types.js').SnippetData} SnippetData */

export default class StorageHandler {
  /**
   * @param {StorageBackend[]} backends
   */
  constructor(backends) {
    this._backends = backends;
  }

  /**
   * @returns {StorageBackend}
   */
  _first() {
    return this._backends[0];
  }

  /**
   * @param {Revision} revision
   * @returns {StorageBackend | null}
   */
  _owns(revision) {
    for (const backend of this._backends) {
      if (backend.owns(revision)) {
        return backend;
      }
    }
    return null;
  }

  /**
   * @param {Revision} revision
   * @returns {void}
   */
  updateHash(revision) {
    global.location.hash = revision.getPath();
  }

  /**
   * @returns {Promise<Revision | null>}
   */
  fetchFromURL() {
    if (/^#?\/?$/.test(global.location.hash)) {
      return Promise.resolve(null);
    }
    for (const backend of this._backends) {
      if (backend.matchesURL()) {
        return backend.fetchFromURL();
      }
    }
    return Promise.reject(new Error('Unknown URL format.'));
  }

  /**
   * Create a new snippet.
   * @param {SnippetData} data
   * @returns {Promise<Revision>}
   */
  create(data) {
    return this._first().create(data);
  }

  /**
   * Update an existing snippet.
   * @param {Revision} revision
   * @param {SnippetData} data
   * @returns {Promise<Revision>}
   */
  update(revision, data) {
    return this._first().update(revision, data);
  }

  /**
   * Fork existing snippet.
   * @param {Revision} revision
   * @param {SnippetData} data
   * @returns {Promise<Revision>}
   */
  fork(revision, data) {
    return this._first().fork(revision, data);
  }
}
