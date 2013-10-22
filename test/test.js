/* global describe, it */
var JAM = require('../');
var assert = require('assert');
var path = require('path');
var util = require('util');
var extend = util._extend;
var headCount = 9151;
var headSample = 8222;
var headSampleth = '8222nd';

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

describe('Fidonet JAM', function(){
   var blog = JAM( path.join(__dirname, 'BLOG-MTW') );

   it('reads index, can clear the cache aftwerwards', function(done){
      blog.readJDX(function(err){
         if (err) throw err;

         assert.equal(blog.size(), headCount);
         blog.clearCache('headers');
         assert.equal(blog.size(), headCount);
         blog.clearCache('index');
         assert.equal(blog.indexStructure, null);

         done();
      });
   });
   it('reads the fixed header and also can clear the cache', function(done){
      blog.readFixedHeaderInfoStruct(function(err, FixedHeaderInfoStruct){
         if (err) throw err;

         assert.equal(FixedHeaderInfoStruct.activemsgs, headCount);
         console.log('The fixed header:');
         console.log(util.inspect(FixedHeaderInfoStruct,
            false, Infinity, true
         ));

         assert.notEqual(blog.JHR, null);
         blog.clearCache('headers');
         assert.equal(blog.JHR, null);

         done();
      });
   });
   it('reads the '+headSampleth+
      ' header, its encoding and contents, clears cache',
   function(done){
      blog.readHeader(headSample, function(err, header){
         if (err) throw err;

         console.log('The '+headSampleth+' header:');
         console.log( util.inspect(header, false, Infinity, true) );

         console.log('The '+headSampleth+' header (decoded):');
         console.log(util.inspect(
            blog.decodeHeader(header), false, Infinity, true
         ));

         assert.deepEqual(
            header.Subfields[4].Buffer,
            new Buffer('323a353036332f3838203530346233666235', 'hex')
         );
         assert.equal( blog.encodingFromHeader(header), 'cp866' );

         blog.decodeMessage(header, function(err, messageText){
            if (err) throw err;

            console.log('The '+headSampleth+' message (decoded):');
            console.log(util.inspect(
               messageText, false, Infinity, true
            ));
            console.log('The '+headSampleth+' message (output):');
            console.log(messageText);

            assert.notDeepEqual(
               messageText.indexOf('\n\n\nЭто знакъ.\n\n\n'),
               -1
            );

            assert.notEqual(blog.JDT, null);
            assert.notEqual(blog.JHR, null);
            assert.notEqual(blog.indexStructure, null);
            blog.clearCache('text');
            assert.equal(blog.JDT, null);
            assert.notEqual(blog.JHR, null);
            assert.notEqual(blog.indexStructure, null);
            blog.clearCache();
            assert.equal(blog.JHR, null);
            assert.equal(blog.indexStructure, null);

            done();
         });
      });
   });
   it('reads '+headCount+' headers from the message base', function(done){
      blog.readAllHeaders(function(err, data){
         if (err) throw err;

         assert.equal(data.MessageHeaders.length, headCount);
         done();
      });
   });
});