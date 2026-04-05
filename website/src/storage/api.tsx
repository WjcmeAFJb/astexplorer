// oxlint-disable typescript-eslint/prefer-nullish-coalescing, typescript-eslint/strict-boolean-expressions -- legacy untyped code; full strict typing migration tracked as tech debt
import 'isomorphic-fetch';

const API_HOST = process.env.API_HOST || '';

export default function api(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${API_HOST}/api/v1${path}`, options);
}
