var fs = require('fs');

function getSubfieldTypeFromLoID(LoID){
   /* jshint indent: false */
   switch( LoID ){
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

var JAM = function(echoPath){
   if (!(this instanceof JAM)) return new JAM(echoPath);

   this.echoPath = echoPath;

   // Buffers:
   this.JHR = null;
   this.indexStructure = null;
   /*
   this.JDT = null;
   this.JLR = null;
   */
};

JAM.prototype.readJHR = function(callback){ // (err)
   var _JAM = this;
   if (_JAM.JHR !== null) return callback(null);

   fs.readFile(_JAM.echoPath+'.jhr', function (err, data) {
      if (err) return callback(err);

      _JAM.JHR = data;
      callback(null);
   });
};

JAM.prototype.readJDX = function(callback){ // (err)
   var _JAM = this;
   if (_JAM.indexStructure !== null) return callback(null);

   fs.readFile(_JAM.echoPath+'.jdx', function (err, data) {
      if (err) return callback(err);

      var indexOffset = 0;
      var nextToCRC;  // ulong (4 bytes) 32-bit
      var nextOffset; // ulong (4 bytes) 32-bit
      _JAM.indexStructure = [];
      while( indexOffset + 8 <= data.length ){
         nextToCRC = data.readUInt32LE(indexOffset);
         indexOffset += 4;
         nextOffset = data.readUInt32LE(indexOffset);
         indexOffset += 4;
         if( nextToCRC !== 0xffffffff || nextOffset !== 0xffffffff ){
            _JAM.indexStructure.push({
               'ToCRC':  nextToCRC,
               'offset': nextOffset
            });
         }
      }

      callback(null);
   });
};

JAM.prototype.size = function(){
   if( this.indexStructure === null ){
      return void 0;
   } else {
      return this.indexStructure.length;
   }
};

JAM.prototype.clearCache = function(){
   this.JHR = null;
   this.indexStructure = null;
};

JAM.prototype.readFixedHeaderInfoStruct = function(callback){ // err, struct
   var _JAM = this;

   _JAM.readJHR(function(err){
      if (err) return callback(err);

      var offsetJHR = 0;
      var FixedHeaderInfoStruct = {};

      FixedHeaderInfoStruct.Signature = new Buffer(4);
      _JAM.JHR.copy(FixedHeaderInfoStruct.Signature, 0, 0, 4);
      offsetJHR += 4;

      FixedHeaderInfoStruct.datecreated =
         _JAM.JHR.readUInt32LE(offsetJHR); //ulong
      offsetJHR += 4;

      FixedHeaderInfoStruct.modcounter =
         _JAM.JHR.readUInt32LE(offsetJHR); //ulong
      offsetJHR += 4;

      FixedHeaderInfoStruct.activemsgs =
         _JAM.JHR.readUInt32LE(offsetJHR); //ulong
      offsetJHR += 4;

      FixedHeaderInfoStruct.passwordcrc =
         _JAM.JHR.readUInt32LE(offsetJHR); //ulong
      offsetJHR += 4;

      FixedHeaderInfoStruct.basemsgnum =
         _JAM.JHR.readUInt32LE(offsetJHR); //ulong
      //offsetJHR += 4;

      callback(null, FixedHeaderInfoStruct);
   });
};

JAM.prototype.readHeader = function(number, callback){ // err, struct
   var _JAM = this;
   if( number <= 0 ){
      return callback(new Error(this.errors.NOT_A_POSITIVE));
   }

   _JAM.readJDX(function(err){
      if (err) return callback(err);
      if( number > _JAM.size() ){
         return callback(new Error(this.errors.TOO_BIG));
      }

      _JAM.readJHR(function(err){
         if (err) return callback(err);

         var header = {};
         var offsetJHR = _JAM.indexStructure[number-1].offset;

         header.Signature = new Buffer(4);
         _JAM.JHR.copy(header.Signature, 0, offsetJHR, offsetJHR+4);
         offsetJHR += 4;

         header.Revision = _JAM.JHR.readUInt16LE(offsetJHR);
         offsetJHR += 2; //ushort
         header.ReservedWord = _JAM.JHR.readUInt16LE(offsetJHR);
         offsetJHR += 2; //ushort

         header.SubfieldLen = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.TimesRead = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.MSGIDcrc = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.REPLYcrc = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.ReplyTo = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.Reply1st = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.Replynext = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.DateWritten = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.DateReceived = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.DateProcessed = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.MessageNumber = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.Attribute = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.Attribute2 = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.Offset = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.TxtLen = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.PasswordCRC = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.Cost = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong

         header.Subfields = [];
         var preSubfields = offsetJHR;
         while( offsetJHR - preSubfields < header.SubfieldLen ){
            var subfield = {};

            subfield.LoID = _JAM.JHR.readUInt16LE(offsetJHR);
            offsetJHR += 2; //ushort
            subfield.HiID = _JAM.JHR.readUInt16LE(offsetJHR);
            offsetJHR += 2; //ushort
            subfield.datlen = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong

            subfield.Buffer = new Buffer(subfield.datlen);
            _JAM.JHR.copy(
               subfield.Buffer, 0, offsetJHR, offsetJHR+subfield.datlen
            );
            offsetJHR += subfield.datlen;

            subfield.type = getSubfieldTypeFromLoID( subfield.LoID );

            header.Subfields.push( subfield );
         }

         callback(null, header );
      });
   });
};

JAM.prototype.encodingFromHeader = function(header){
   var fields = header.Subfields;
   var kludges = [];
   var i;
   for( i = 0; i < fields.length; i++ ){
      if( fields[i].LoID === 2000 ){ // FTSKLUDGE
         kludges.push( fields[i].Buffer.toString('ascii').toLowerCase() );
      }
   }
   for( i = 0; i < kludges.length; i++ ){
      var parts = /^(chrs|charset):\s*(\S+)(\s.*)?$/.exec(kludges[i]);
      if( parts !== null ){
         var chrs = parts[2];
         if( chrs === 'ibmpc' ){
            for( var j = 0; j < kludges.length; j++ ){
               parts = /^codepage:\s*(\S+)(\s.*)?$/.exec(kludges[i]);
               if( parts !== null ){
                  chrs = parts[1];
                  if( chrs === '+7_fido' ) return 'cp866';
                  return chrs;
               }
            }
         } else if( chrs === '+7_fido' ) return 'cp866';
         return chrs;
      }
   }
   return null;
};

JAM.prototype.readAllHeaders = function(callback){ // err, struct
   var _JAM = this;
   _JAM.readJDX(function(err){
      if (err) return callback(err);

      _JAM.readJHR(function(err){
         if (err) return callback(err);

         _JAM.readFixedHeaderInfoStruct(function(err, FixedHeaderInfoStruct){
            if (err) return callback(err);

            var structure = {
               'FixedHeaderInfoStruct': FixedHeaderInfoStruct,
               'MessageHeaders': []
            };
            var nextHeaderNumber = 0;
            var baseSize = _JAM.size();
            var nextStep = setImmediate || process.nextTick;

            var nextHeaderProcessor = function(){
               if( nextHeaderNumber >= baseSize ){
                  // all headers are processed
                  return callback(null, structure);
               }
               // process the next header
               nextHeaderNumber++;
               _JAM.readHeader(nextHeaderNumber, function(err, nextHeader){
                  if(err) return callback(err);

                  structure.MessageHeaders.push( nextHeader );
                  nextStep(nextHeaderProcessor);
               });
            };

            nextHeaderProcessor();
         });
      });
   });
};

JAM.prototype.errors = {
   NOT_A_POSITIVE: "The message's number must be positive!",
   TOO_BIG: "The message's number exceed the message base's size!"
};

module.exports = JAM;