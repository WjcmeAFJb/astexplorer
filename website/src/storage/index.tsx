import type {SnippetData, Revision, StorageBackend} from '../types';

export default class StorageHandler {
  _backends: StorageBackend[];

    constructor(backends: StorageBackend[]) {
    this._backends = backends;
  }

  /**
   * @returns {StorageBackend}
   */
  _first() {
    return this._backends[0];
  }

    _owns(revision: Revision): StorageBackend | null {
    for (const backend of this._backends) {
      if (backend.owns(revision)) {
        return backend;
      }
    }
    // oxlint-disable-next-line unicorn/no-null -- return type is StorageBackend | null; null means "no backend owns this revision"
    return null;
  }

    updateHash(revision: Revision): void {
    window.location.hash = revision.getPath();
  }

  /**
   * @returns {Promise<Revision | null>}
   */
  fetchFromURL() {
    if (/^#?\/?$/.test(window.location.hash)) {
      // oxlint-disable-next-line unicorn/no-null -- fetchFromURL returns Promise<Revision | null>; null means "no snippet to load"
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
 */
  create(data: SnippetData): Promise<Revision> {
    return this._first().create(data);
  }

  /**

   * Update an existing snippet.
 */
  update(revision: Revision, data: SnippetData): Promise<Revision> {
    return this._first().update(revision, data);
  }

  /**

   * Fork existing snippet.
 */
  fork(revision: Revision, data: SnippetData): Promise<Revision> {
    return this._first().fork(revision, data);
  }
}
