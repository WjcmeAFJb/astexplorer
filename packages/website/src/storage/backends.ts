import type { StorageBackend } from '../types';
import * as gist from './gist';
import * as parse from './parse';
import StorageHandler from './index';

const backends: StorageBackend[] = [gist, parse];
export const storageAdapter = new StorageHandler(backends);
