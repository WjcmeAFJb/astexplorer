// Browser-compatible fs shim for parsers that need fs.readFileSync etc.
// All functions throw ENOENT, matching real Node.js behavior for nonexistent files.
function enoent(p) {
  var e = new Error('ENOENT: no such file or directory, open \'' + p + '\'');
  e.code = 'ENOENT';
  e.errno = -2;
  e.syscall = 'open';
  throw e;
}
var realpathSync = function(p) { return p; };
realpathSync.native = realpathSync;

module.exports = {
  readFileSync: enoent,
  writeFileSync: function() {},
  existsSync: function() { return false; },
  readdirSync: function() { return []; },
  statSync: enoent,
  lstatSync: enoent,
  mkdirSync: function() {},
  realpathSync: realpathSync,
  watch: function() {},
  watchFile: function() {},
};
