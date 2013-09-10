/* global describe, it */
var JAM = require('../');
var assert = require('assert');
var path = require('path');
var util = require('util');

describe('Fidonet JAM', function(){
   it('reads 8222 headers from the message base', function(done){
      var blog = JAM( path.join(__dirname, 'BLOG-MTW') );

      blog.ReadHeaders(function(err,data){
         if (err) throw err;

         assert.equal(data.MessageHeaders.length, 8222);
         console.log('The last header:');
         console.log(util.inspect(
            data.MessageHeaders[data.MessageHeaders.length-1],
            false, Infinity, true
         ));
         done();
      });
   });
});