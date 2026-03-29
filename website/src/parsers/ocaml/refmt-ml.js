import config from '../reason/refmt';

const ID = 'refmt-ml';

export default {
  ...config,
  id: ID,
  parse: function(/** @type {any} */ parser, /** @type {string} */ code) {
    return parser.parseOcaml(code);
  },
};
