#!/usr/bin/env node
// Quick test that the built parsers package works in Node.js

const parsers = require('./dist/index.js');

console.log('=== astexplorer-parsers Node.js test ===\n');

// Test categories
console.log('Categories:', parsers.categories.length);
console.log('Category names:', parsers.categories.map(c => c.id).join(', '));

// Test getDefaultCategory
const defaultCat = parsers.getDefaultCategory();
console.log('\nDefault category:', defaultCat.id, '-', defaultCat.displayName);
console.log('  parsers:', defaultCat.parsers.length);
console.log('  transformers:', defaultCat.transformers.length);

// Test getCategoryByID
const jsCat = parsers.getCategoryByID('javascript');
console.log('\nJavaScript category:', jsCat.id);
console.log('  Parser names:', jsCat.parsers.map(p => p.id).filter(Boolean).join(', '));

// Test getDefaultParser
const defaultParser = parsers.getDefaultParser(jsCat);
console.log('\nDefault JS parser:', defaultParser.id, '-', defaultParser.displayName);
console.log('  showInMenu:', defaultParser.showInMenu);
console.log('  hasSettings:', defaultParser.hasSettings());

// Test getParserByID
const esprima = parsers.getParserByID('esprima');
if (esprima) {
  console.log('\nEsprima parser:', esprima.id);
  console.log('  defaultOptions:', JSON.stringify(esprima.getDefaultOptions()));
}

// Test code examples
console.log('\nJS code example (first 50 chars):', jsCat.codeExample.substring(0, 50));

// Test that all categories have code examples
let allHaveExamples = parsers.categories.every(c => typeof c.codeExample === 'string' && c.codeExample.length > 0);
console.log('\nAll categories have code examples:', allHaveExamples);

// Test that all parsers have IDs (excluding stray files like codeMirrorMode)
let parsersWithIds = 0;
let parsersWithoutIds = 0;
parsers.categories.forEach(c => {
  c.parsers.forEach(p => {
    if (p.id) parsersWithIds++;
    else parsersWithoutIds++;
  });
});
console.log('Parsers with IDs:', parsersWithIds);
console.log('Parsers without IDs (stray files):', parsersWithoutIds);

console.log('\n=== All tests passed ===');
