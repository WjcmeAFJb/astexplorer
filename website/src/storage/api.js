import 'isomorphic-fetch';

const API_HOST = process.env.API_HOST || '';

/**
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export default function api(path, options) {
  return fetch(`${API_HOST}/api/v1${path}`, options);
}
