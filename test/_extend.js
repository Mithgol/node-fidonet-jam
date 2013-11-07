/*global describe, it */
var extend = require('util')._extend;
var assert = require('assert');

describe('hidden util._extend(defaults, options) method', function(){
   it('returns defaults if options are missing', function(){
      assert.deepEqual(
         extend({foo: 'bar', baz: ['qux', 'quux']}),
         {foo: 'bar', baz: ['qux', 'quux']}
      );
   });
   it('adds elements of options to defaults', function(){
      assert.deepEqual(
         extend({foo: 'bar', baz: ['qux', 'quux']}, {jinx: 'added'}),
         {foo: 'bar', baz: ['qux', 'quux'], jinx: 'added'}
      );
   });
   it('replaces defaults with options (one level deep)', function(){
      assert.deepEqual(
         extend({foo: 'bar', baz: ['qux', 'quux']}, {foo: 'replaced'}),
         {foo: 'replaced', baz: ['qux', 'quux']}
      );
   });
   it('replaces entire array elements (does not extend them)', function(){
      assert.deepEqual(
         extend({foo: 'bar', baz: ['qux', 'quux']}, {baz: ['replaced']}),
         {foo: 'bar', baz: ['replaced']}
      );
   });
   it('does not extend nested objects (replaces them instead)', function(){
      assert.deepEqual(
         extend({foo: 'bar', baz: {qux: 'quux'}}, {baz: {jinx: 'replaced'}}),
         {foo: 'bar', baz: {jinx: 'replaced'}}
      );
   });
});