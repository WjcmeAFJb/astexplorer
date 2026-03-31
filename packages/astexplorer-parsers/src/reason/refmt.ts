import defaultParserInterface from '../utils/defaultParserInterface';
import esyPkg from 'astexplorer-refmt/esy.json';
import addCodeMirrorMode from './codeMirrorMode';

try {
  const CodeMirror = require('codemirror');
  addCodeMirrorMode(CodeMirror);
} catch (e) {
  // codemirror not available in this environment
}

const ID = 'refmt';
const locKeys = [
  'loc',
  'pcd_loc',
  'pcf_loc',
  'pci_loc',
  'pcl_loc',
  'pctf_loc',
  'pcty_loc',
  'pexp_loc',
  'pext_loc',
  'pincl_loc',
  'pld_loc',
  'pmb_loc',
  'pmd_loc',
  'pmod_loc',
  'pmtd_loc',
  'pmty_loc',
  'popen_loc',
  'ppat_loc',
  'psig_loc',
  'pstr_loc',
  'ptyp_loc',
  'ptype_loc',
  'pval_loc',
  'pvb_loc',
];
// @ts-expect-error — indexing dynamic object
// oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- @ts-expect-error makes type error
const parserVersion = esyPkg.dependencies['@esy-ocaml/reason'];

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- parserVersion from @ts-expect-error context
  version: parserVersion,
  homepage: `https://www.npmjs.com/package/@esy-ocaml/reason/v/${parserVersion}`,
  locationProps: new Set(locKeys),

  loadParser(callback: (realParser: {parseReason: (code: string) => unknown}) => void) {
    require(['astexplorer-refmt'], callback);
  },

  parse(parser: {parseReason: (code: string) => unknown}, code: string) {
    return parser.parseReason(code);
  },

  getNodeName(node: Record<string, unknown>) {
    return node.type;
  },

  nodeToRange(node: Record<string, unknown>) {
    const locKey = locKeys.find(key => Object.prototype.hasOwnProperty.call(node, key));
    if (locKey) {
      const loc = (node[locKey] as {loc_start: {pos_cnum: number}, loc_end: {pos_cnum: number}});
      const range = [
        loc.loc_start.pos_cnum,
        loc.loc_end.pos_cnum,
      ];
      return range;
    }
  },
};
