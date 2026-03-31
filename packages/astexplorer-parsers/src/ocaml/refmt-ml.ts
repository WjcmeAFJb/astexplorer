import config from '../reason/refmt';

const ID = 'refmt-ml';

export default {
  ...config,
  id: ID,
  parse: function(parser: {parseOcaml: (code: string) => unknown}, code: string) {
    return parser.parseOcaml(code);
  },
};
