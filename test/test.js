/* global describe, it, done */
var JAM = require('../');
var path = require('path');
var util = require('util');

describe('Fidonet JAM', function(){
   it('reads the headers from the message base', function(){
      var blog = JAM( path.join(__dirname, 'BLOG-MTW') );

      blog.ReadHeaders(function(err,data){
         if (err) throw err;

         console.log('Read '+data.MessageHeaders.length+' message headers.');
         console.log('The last header:');
         console.log(util.inspect(
            data.MessageHeaders[data.MessageHeaders.length-1],
            false, Infinity, true
         ));
         done();
      });
   });
});