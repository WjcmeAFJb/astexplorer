import JSON from './JSON';
import Tree from './Tree';

export default [
  Tree,
  JSON,
] as Array<React.FunctionComponent<Record<string, unknown>> & {name: string}>;
