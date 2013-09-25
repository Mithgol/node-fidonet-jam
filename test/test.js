/* global describe, it */
var JAM = require('../');
var assert = require('assert');
var path = require('path');
var util = require('util');
var headCount = 9151;

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
   it('reads '+headCount+' headers from the message base', function(done){
      blog.readAllHeaders(function(err,data){
         if (err) throw err;

         assert.equal(data.MessageHeaders.length, headCount);
         console.log('The last header:');
         console.log(util.inspect(
            data.MessageHeaders[data.MessageHeaders.length-1],
            false, Infinity, true
         ));
         done();
      });
   });
});