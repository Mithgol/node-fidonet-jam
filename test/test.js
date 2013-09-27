/* global describe, it */
var JAM = require('../');
var assert = require('assert');
var path = require('path');
var util = require('util');
var headCount = 9151;
var headSample = 8222;

describe('Fidonet JAM', function(){
   var blog = JAM( path.join(__dirname, 'BLOG-MTW') );

   it('reads index and can destroy it', function(done){
      blog.readJDX(function(err){
         if (err) throw err;

         assert.equal(blog.size(), headCount);
         blog.clearCache();
         assert.equal(blog.indexStructure, null);

         done();
      });
   });
   it('reads the fixed header', function(done){
      blog.readFixedHeaderInfoStruct(function(err, FixedHeaderInfoStruct){
         if (err) throw err;

         assert.equal(FixedHeaderInfoStruct.activemsgs, headCount);
         console.log('The fixed header:');
         console.log(util.inspect(FixedHeaderInfoStruct,
            false, Infinity, true
         ));
         done();
      });
   });
   it('reads the '+headSample+'nd header, finds its encoding', function(done){
      blog.readHeader(headSample, function(err,header){
         if (err) throw err;

         console.log('The '+headSample+'nd header:');
         console.log( util.inspect(header, false, Infinity, true) );

         assert.deepEqual(
            header.Subfields[4].Buffer,
            new Buffer('323a353036332f3838203530346233666235', 'hex')
         );
         assert.equal( blog.encodingFromHeader(header), 'cp866' );
         done();
      });
   });
   it('reads '+headCount+' headers from the message base', function(done){
      blog.readAllHeaders(function(err,data){
         if (err) throw err;

         assert.equal(data.MessageHeaders.length, headCount);
         done();
      });
   });
});