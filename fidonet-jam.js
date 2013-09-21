var fs      = require('fs');
var jParser = require('jParser');

var ulong  = 'uint32';
var ushort = 'uint16';

var JAM = function(echoPath){
   if (!(this instanceof JAM)) return new JAM(echoPath);

   this.echoPath = echoPath;

   // Buffers:
   this.JHR = null;
   this.JDX = null;
   this.indexStructure = null;
   /*
   this.JDT = null;
   this.JLR = null;
   */
};

JAM.prototype.readJHR = function(callback){ // (err)_JAM
   var _JAM = this;
   if (_JAM.JHR !== null) callback(null);

   fs.readFile(_JAM.echoPath+'.jhr', function (err, data) {
      if (err) callback(err);

      _JAM.JHR = data;
      callback(null);
   });
};

JAM.prototype.readJDX = function(callback){ // (err)
   var _JAM = this;
   if (_JAM.JDX !== null) callback(null);

   fs.readFile(_JAM.echoPath+'.jdx', function (err, data) {
      if (err) callback(err);

      _JAM.JDX = data;
      callback(null);
   });
};

JAM.prototype.ReadAllHeaders = function(callback){ // err, struct
   var _JAM = this;
   _JAM.readJDX(function(err){
      if (err) callback(err);

      var indexOffset = 0;
      var nextToCRC;  // ulong (4 bytes) 32-bit
      var nextOffset; // ulong (4 bytes) 32-bit
      _JAM.indexStructure = [];
      while( indexOffset + 8 <= _JAM.JDX.length ){
         nextToCRC = _JAM.JDX.readUInt32LE(indexOffset);
         indexOffset += 4;
         nextOffset = _JAM.JDX.readUInt32LE(indexOffset);
         indexOffset += 4;
         if( nextToCRC !== 0xffffffff || nextOffset !== 0xffffffff ){
            _JAM.indexStructure.push({
               'ToCRC':  nextToCRC,
               'offset': nextOffset
            });
         }
      }

      _JAM.readJHR(function(err){
         if (err) callback(err);

         var indexLen = _JAM.indexStructure.length;
         var indexNum = 0;

         var parser = new jParser(_JAM.JHR, {
            'reserved1000uchar': function(){
               this.skip(1000);
               return true;
            },
            'JAM0' : ['string', 4],
            'FixedHeaderInfoStruct': {
               'Signature':   'JAM0',
               'datecreated': ulong,
               'modcounter':  ulong,
               'activemsgs':  ulong,
               'passwordcrc': ulong,
               'basemsgnum':  ulong,
               'RESERVED':    'reserved1000uchar',
            },
            'SubField': {
               'LoID':   ushort,
               'HiID':   ushort,
               'datlen': ulong,
               'Buffer': ['string', function(){
                  return this.current.datlen;
               }],
               'type': function(){
                  // jshint indent: false
                  switch( this.current.LoID ){
                     case 0: return 'OADDRESS'; //break;
                     case 1: return 'DADDRESS'; //break;
                     case 2: return 'SENDERNAME'; //break;
                     case 3: return 'RECEIVERNAME'; //break;
                     case 4: return 'MSGID'; //break;
                     case 5: return 'REPLYID'; //break;
                     case 6: return 'SUBJECT'; //break;
                     case 7: return 'PID'; //break;
                     case 8: return 'TRACE'; //break;
                     case 9: return 'ENCLOSEDFILE'; //break;
                     case 10: return 'ENCLOSEDFILEWALIAS'; //break;
                     case 11: return 'ENCLOSEDFREQ'; //break;
                     case 12: return 'ENCLOSEDFILEWCARD'; //break;
                     case 13: return 'ENCLOSEDINDIRECTFILE'; //break;
                     case 1000: return 'EMBINDAT'; //break;
                     case 2000: return 'FTSKLUDGE'; //break;
                     case 2001: return 'SEENBY2D'; //break;
                     case 2002: return 'PATH2D'; //break;
                     case 2003: return 'FLAGS'; //break;
                     case 2004: return 'TZUTCINFO'; //break;
                     default: return 'UNKNOWN'; //break;
                  }
               }
            },
            'MessageHeader': {
               'Signature': function(){
                  this.seek( _JAM.indexStructure[indexNum].offset );
                  indexNum++;
                  return this.parse('JAM0');
               },
               'Revision': ushort,
               'ReservedWord': ushort,
               'SubfieldLen': ulong,
               'TimesRead': ulong,
               'MSGIDcrc': ulong,
               'REPLYcrc': ulong,
               'ReplyTo': ulong,
               'Reply1st': ulong,
               'Replynext': ulong,
               'DateWritten': ulong,
               'DateReceived': ulong,
               'DateProcessed': ulong,
               'MessageNumber': ulong,
               'Attribute': ulong,
               'Attribute2': ulong,
               'Offset': ulong,
               'TxtLen': ulong,
               'PasswordCRC': ulong,
               'Cost': ulong,
               'Subfields': function(){
                  var final = this.tell() + this.current.SubfieldLen;
                  var sfArray = [];
                  while (this.tell() < final) {
                     sfArray.push( this.parse('SubField') );
                  }
                  return sfArray;
               }
            },
            'JHR': {
               'FixedHeader': 'FixedHeaderInfoStruct',
               'MessageHeaders': function(){
                  var mhArray = [];
                  var nextMessageHeader;
                  do {
                     nextMessageHeader = this.parse('MessageHeader');
                     mhArray.push(nextMessageHeader);
                  } while (indexNum < indexLen);
                  return mhArray;
               }
            }
         });

         callback(null, parser.parse('JHR'));
      });
   });
};

module.exports = JAM;