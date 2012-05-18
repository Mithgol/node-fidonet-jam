var fs      = require('fs');
var jParser = require('jParser');
var util    = require('util');

var ulong  = 'uint32';
var ushort = 'uint16';

var NOP = function(){};
var lastGood = {};

var JAM = function(echotag){
   if (!(this instanceof JAM)) return new JAM(echotag);

   this.echotag = echotag;

   // Buffers:
   this.JHR = null;
   /*
   this.JDT = null;
   this.JDX = null;
   this.JLR = null;
   */
}

JAM.prototype.readJHR = function(callback){ // (err)
   if (this.JHR !== null) callback(null);

   fs.readFile(this.echotag+'.JHR', function (err, data) {
      if (err) callback(err);

      this.JHR = data;
      callback(null);
   });
}

JAM.prototype.FixedHeaderInfoStruct = function(callback){ // err, struct
   this.readJHR(function(err){
      if (err) callback(err);

      var thisJAM = this;

      var parser = new jParser(this.JHR, {
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
            'Buffer': ['string', function(){ return this.current.datlen }]
            /*
            'type': function(){
               switch( this.current.LoID ){
                  case 0: return 'OADDRESS'; break;
                  case 1: return 'DADDRESS'; break;
                  case 2: return 'SENDERNAME'; break;
                  case 3: return 'RECEIVERNAME'; break;
                  case 4: return 'MSGID'; break;
                  case 5: return 'REPLYID'; break;
                  case 6: return 'SUBJECT'; break;
                  case 7: return 'PID'; break;
                  case 8: return 'TRACE'; break;
                  case 9: return 'ENCLOSEDFILE'; break;
                  case 10: return 'ENCLOSEDFILEWALIAS'; break;
                  case 11: return 'ENCLOSEDFREQ'; break;
                  case 12: return 'ENCLOSEDFILEWCARD'; break;
                  case 13: return 'ENCLOSEDINDIRECTFILE'; break;
                  case 1000: return 'EMBINDAT'; break;
                  case 2000: return 'FTSKLUDGE'; break;
                  case 2001: return 'SEENBY2D'; break;
                  case 2002: return 'PATH2D'; break;
                  case 2003: return 'FLAGS'; break;
                  case 2004: return 'TZUTCINFO'; break;
                  default: return 'UNKNOWN'; break;
               }
            }
            */
         },
         'MessageHeader': {
            'Signature': 'JAM0',
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
            'Subfields': ['string', function(){ return this.current.SubfieldLen; } ],
            /*
            'Subfields': function(){
               var final = this.tell() + this.current.SubfieldLen;
               var sfArray = [];
               while (this.tell() < final) {
                  sfArray.push( this.parse('SubField') );
               }
               return sfArray;
            },
            */
            'AfterSubfields': function(){
               var initial = this.tell();
               var bytesLeft = thisJAM.JHR.length - initial - 4;
               var seekJump = 0;
               var sigFound = false;
               var raw = this;
               if (bytesLeft <= 0) return 0;
               do {
                  this.seek(initial + seekJump, function(){
                     var moveSIG = raw.parse('JAM0');
                     if (moveSIG === 'JAM\0') {
                        sigFound = true;
                        /*
                        if (seekJump > 0){
                           console.log(
                              'initial = ' + initial +
                              ', seekJump = ' + seekJump +
                              ', moveSIG = ' + moveSIG
                           );
                        }
                        */
                     }
                  });
                  seekJump++;
               } while (!sigFound && (seekJump < bytesLeft) );
               this.skip(seekJump-1);
               return seekJump-1;
            }
         },
         'JHR': {
            'FixedHeader': 'FixedHeaderInfoStruct',
            'MessageHeaders': function(){
               var mhArray = [];
               while (this.tell() < thisJAM.JHR.length - 69) {
                  mhArray.push( this.parse('MessageHeader') );
               }
               return mhArray;
            }
         }
      });

      callback(null, parser.parse('JHR'));
   });
}

module.exports = JAM;