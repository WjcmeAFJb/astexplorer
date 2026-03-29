import config from '../reason/refmt';

const ID = 'refmt-ml';

export default {
  ...config,
  id: ID,
  parse: function(/** @type {{parseOcaml: (code: string) => unknown}} */ parser, /** @type {string} */ code) {
    return parser.parseOcaml(code);
  },
};
