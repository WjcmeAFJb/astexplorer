import JSON from './JSON';
import Tree from './Tree';

/** @type {Array<(props: {parseResult: import('../../types.js').ParseResult, position?: number | null}) => React.ReactElement>} */
export default [
  Tree,
  JSON,
];
