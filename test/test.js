/* global describe, it */
var JAM = require('../');
var assert = require('assert');
var path = require('path');
var util = require('util');
var headCount = 9151;
var headSample = 8222;
var headSampleth = '8222nd';
var headSampleMSGID = '2:5063/88 504b3fb5';
var childSample = 4834;
var parentSample = 4833;

describe('Fidonet JAM', function(){
   var blog = JAM( path.join(__dirname, 'BLOG-MTW') );

   it('calculates correct JAM CRC-32 of an empty string', function(){
      assert.equal(blog.crc32(''), 4294967295);
   });

   it('calculates correct JAM CRC-32 of the string "Mithgol the Webmaster"',
   function(){
      assert.equal(blog.crc32('Mithgol the Webmaster'), 0x5b12347c);
   });

   it('reads lastreads, can clear the cache afterwards', function(done){
      blog.readJLR(function(err){
         if (err) throw err;

         assert.equal(blog.lastreads.length, 1);
         assert.equal(blog.lastreads[0].UserID, 0x5b12347c);
         blog.clearCache('headers');
         assert.equal(blog.lastreads.length, 1);
         assert.equal(blog.lastreads[0].UserID, 0x5b12347c);
         blog.clearCache('lastreads');
         assert.equal(blog.lastreads, null);

         done();
      });
   });
   it('reads index, can clear the cache afterwards', function(done){
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
      blog.readFixedHeaderInfoStruct(function(err){
         if (err) throw err;

         assert.equal(blog.fixedHeader.activemsgs, headCount);
         console.log('\nThe fixed header:');
         console.log( util.inspect(blog.fixedHeader, false, Infinity, true) );

         assert.notEqual(blog.JHR, null);
         blog.clearCache('headers');
         assert.equal(blog.JHR, null);
         assert.equal(blog.fixedHeader, null);

         done();
      });
   });
   it('correctly calculates the last read position', function(done){
      blog.indexLastRead('Mithgol the Webmaster', function(err, idx){
         if (err) throw err;
         assert.equal(idx, 9150);

         blog.indexLastRead('some unknown user', function(err, idx){
            if (err) throw err;
            assert.equal(idx, null);

            done();
         });
      });
   });
   it('reads the '+headSampleth+
      ' header, its encoding and contents, clears cache',
   function(done){
      blog.readHeader(headSample, function(err, header){
         if (err) throw err;

         console.log('\nThe '+headSampleth+' header:');
         console.log( util.inspect(header, false, Infinity, true) );

         console.log('The '+headSampleth+' header (decoded):');
         console.log(util.inspect(
            blog.decodeHeader(header), false, Infinity, true
         ));

         header.Subfields.forEach(function(subfield){
            if( subfield.type === 'MSGID' ){
               assert.equal(
                  blog.crc32( subfield.Buffer.toString('binary'), true ),
                  header.MSGIDcrc
               );
            }
         });

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
      blog.readAllHeaders(function(err, messageHeaders){
         if (err) throw err;

         assert.equal(messageHeaders.length, headCount);
         done();
      });
   });
   it('MessageNum0 + basemsgnum === MessageNumber everywhere', function(done){
      blog.readJDX(function(err){
         if (err) throw err;

         blog.readAllHeaders(function(err, messageHeaders){
            if (err) throw err;

            messageHeaders.forEach(function(currentHeader, headerIDX){
               assert.strictEqual(
                  blog.indexStructure[headerIDX].MessageNum0 +
                  blog.fixedHeader.basemsgnum,
                  currentHeader.MessageNumber
               );
            });
            done();
         });
      });
   });
   it('the cache is cleared, then a MSGID search is correct', function(done){
      blog.clearCache();
      blog.numbersForMSGID(headSampleMSGID, function(err, arr){
         if (err) throw err;
         assert.deepEqual(arr, [headSample]);

         blog.numbersForMSGID([
            headSampleMSGID, 'some wrong MSGID'
         ], function(err, arr){
            if (err) throw err;
            assert.deepEqual(arr, [headSample]);

            blog.numbersForMSGID('some wrong MSGID', function(err, arr){
               if (err) throw err;
               assert.deepEqual(arr, []);
               done();
            });
         });
      });
   });
   it('gets the correct number of the parent', function(done){
      blog.getParentNumber(childSample, function(err, parentNumber){
         if (err) throw err;
         assert.equal(parentNumber, parentSample);
         done();
      });
   });
   it('gets the correct number of the 1st child', function(done){
      blog.get1stChildNumber(parentSample, function(err, childNumber){
         if (err) throw err;
         assert.equal(childNumber, childSample);
         done();
      });
   });
});