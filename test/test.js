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
   it('reads '+headCount+' headers from the message base', function(done){
      blog.readAllHeaders(function(err,data){
         if (err) throw err;

         assert.equal(data.MessageHeaders.length, headCount);
         console.log('The 8222nd header:');
         console.log(util.inspect(data.MessageHeaders[8221],
            false, Infinity, true
         ));
         done();
      });
   });
});