var JAM = require('./');
var util = require('util');

console.log( new Date().toLocaleString() );

var blog = JAM('blog-MtW');

blog.FixedHeaderInfoStruct(function(err,data){
   if (err) throw err;
   //console.log( util.inspect(data, false, Infinity, false) );
   console.log( new Date().toLocaleString() );
});