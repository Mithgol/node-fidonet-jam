var JAM = require('../');
var util = require('util');

console.log( new Date().toLocaleString() );

var blog = JAM('blog-MtW');

blog.ReadHeaders(function(err,data){
   if (err) throw err;

   console.log( new Date().toLocaleString() );
   console.log('Read ' + data.MessageHeaders.length + ' message headers.');
   console.log('The last header:');
   console.log(util.inspect(
      data.MessageHeaders[data.MessageHeaders.length-1], false, Infinity, true
   ));
});