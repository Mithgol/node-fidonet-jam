/* global describe, it */
var JAM = require('../');
var assert = require('assert');
var path = require('path');
var util = require('util');
var headCount = 9151;
var headSample = 8222;
var headSampleth = '8222nd';
var headSampleMSGID = '2:5063/88 504b3fb5';
var parentSample = 768;
var childrenSamples = [769, 770, 771, 772];

describe('Fidonet JAM', () => {
   var blog = JAM( path.join(__dirname, 'BLOG-MTW') );

   it('calculates correct JAM CRC-32 of an empty string', () => {
      assert.equal(blog.crc32(''), 4294967295);
   });

   it(
      'calculates correct JAM CRC-32 of the string "Mithgol the Webmaster"',
      () => assert.equal(blog.crc32('Mithgol the Webmaster'), 0x5b12347c)
   );

   it('reads lastreads, can clear the cache afterwards', done => {
      blog.readJLR(err => {
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
   it('reads index, can clear the cache afterwards', done => {
      blog.readJDX(err => {
         if (err) throw err;

         assert.equal(blog.size(), headCount);
         blog.clearCache('headers');
         assert.equal(blog.size(), headCount);
         blog.clearCache('index');
         assert.equal(blog.indexStructure, null);

         done();
      });
   });
   it('reads the fixed header and also clears the cache afterwards', done => {
      blog.readFixedHeaderInfoStruct(err => {
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
   it('correctly calculates the last read position', done => {
      blog.indexLastRead('Mithgol the Webmaster', (err, idx) => {
         if (err) throw err;
         assert.equal(idx, 9150);

         blog.indexLastRead('some unknown user', (err, idx) => {
            if (err) throw err;
            assert.equal(idx, null);

            done();
         });
      });
   });
   it('reads the '+headSampleth+
      ' header, its encoding and contents, clears cache',
   done => {
      blog.readHeader(headSample, (err, header) => {
         if (err) throw err;

         console.log('\nThe '+headSampleth+' header:');
         console.log( util.inspect(header, false, Infinity, true) );

         console.log('The '+headSampleth+' header (decoded):');
         console.log(util.inspect(
            blog.decodeHeader(header), false, Infinity, true
         ));

         header.Subfields.forEach(subfield => {
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

         console.log('\nKludges of the '+headSampleth+' header:');
         console.log( blog.decodeKludges(header) );

         blog.decodeMessage(header, (err, messageText) => {
            if (err) throw err;

            console.log('\nThe '+headSampleth+' message (decoded):');
            console.log(util.inspect(
               messageText, false, Infinity, true
            ));
            console.log('The '+headSampleth+' message (output):');
            console.log(messageText);

            assert.ok( messageText.includes('\n\n\nЭто знакъ.\n\n\n') );

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
   it('reads '+headCount+' headers from the message base', done => {
      blog.readAllHeaders((err, messageHeaders) => {
         if (err) throw err;

         assert.equal(messageHeaders.length, headCount);
         done();
      });
   });
   it('MessageNum0 + basemsgnum === MessageNumber everywhere', done => {
      blog.readAllHeaders((err, messageHeaders) => {
         if (err) throw err;

         messageHeaders.forEach(
            (currentHeader, headerIDX) => assert.strictEqual(
               blog.indexStructure[headerIDX].MessageNum0 +
               blog.fixedHeader.basemsgnum,
               currentHeader.MessageNumber
            )
         );
         done();
      });
   });
   it('original addresses are available everywhere', done => {
      blog.readAllHeaders((err, messageHeaders) => {
         if (err) throw err;

         var headerIDX = 0;
         var headerNextStep = () => {
            var currentHeader = messageHeaders[headerIDX];
            blog.getOrigAddr(currentHeader, (err, origAddr) => {
               if (err) throw err;

               assert.notStrictEqual(origAddr, null);

               headerIDX++;
               if( headerIDX >= blog.size() ){
                  done();
               } else {
                  headerNextStep();
               }
            });
         };
         headerNextStep();
      });
   });
   it('the cache is cleared, then a MSGID search is correct', done => {
      blog.clearCache();
      blog.numbersForMSGID(headSampleMSGID, (err, arr) => {
         if (err) throw err;
         assert.deepEqual(arr, [headSample]);

         blog.numbersForMSGID([
            headSampleMSGID, 'some wrong MSGID'
         ], (err, arr) => {
            if (err) throw err;
            assert.deepEqual(arr, [headSample]);

            blog.numbersForMSGID('some wrong MSGID', (err, arr) => {
               if (err) throw err;
               assert.deepEqual(arr, []);
               done();
            });
         });
      });
   });
   it('a MSGID search for a header is also correct', done => {
      blog.readHeader(headSample, (err, header) => {
         if (err) throw err;
         header.MessageIndex = headSample;

         blog.headersForMSGID(headSampleMSGID, (err, arr) => {
            if (err) throw err;
            assert.deepEqual(arr, [header]);

            blog.headersForMSGID([
               headSampleMSGID, 'some wrong MSGID'
            ], (err, arr) => {
               if (err) throw err;
               assert.deepEqual(arr, [header]);

               blog.headersForMSGID('some wrong MSGID', (err, arr) => {
                  if (err) throw err;
                  assert.deepEqual(arr, []);
                  done();
               });
            });
         });
      });
   });
   it('gets the correct number of the parent', done => {
      blog.getParentNumber(childrenSamples[1], (err, parentNumber) => {
         if (err) throw err;
         assert.equal(parentNumber, parentSample);
         done();
      });
   });
   it('gets the correct number of the 1st child', done => {
      blog.get1stChildNumber(parentSample, (err, childNumber) => {
         if (err) throw err;
         assert.equal(childNumber, childrenSamples[0]);
         done();
      });
   });
   it('gets the correct number of the next child', done => {
      blog.getNextChildNumber(childrenSamples[2], (err,siblingNumber) => {
         if (err) throw err;
         assert.equal(siblingNumber, childrenSamples[3]);
         done();
      });
   });
   it('gets the correct lists of children', done => {
      blog.getChildrenNumbers(parentSample, (err, childrenNumbers) => {
         if (err) throw err;
         assert.deepEqual(childrenNumbers, childrenSamples);

         blog.getChildrenNumbers(headSample, (err, childrenNumbers) => {
            if (err) throw err;
            assert.deepEqual(childrenNumbers, []);
            done();
         });
      });
   });
});