import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30_000,
    hookTimeout: 600_000, // build can take several minutes
    pool: 'forks', // use process forks for isolation (parsers mutate globals)
  },
});
