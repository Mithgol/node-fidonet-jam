The **Fidonet JAM** module reads headers of Fidonet echomail messages from JAM message bases according to JAM (The Joaquim-Andrew-Mats Message Base Proposal) [quoted in Ru.FTN.Develop.](http://groups.google.com/group/fido7.ru.ftn.develop/msg/e2f5486f80394418)

The module is written in JavaScript and requires [Node.js](http://nodejs.org/) to run.

## Installing Fidonet JAM

[![(npm package version)](https://badge.fury.io/js/fidonet-jam.png)](https://npmjs.org/package/fidonet-jam)

* Latest packaged version: `npm install fidonet-jam`

* Latest githubbed version: `npm install https://github.com/Mithgol/node-fidonet-jam/tarball/master`

The npm package does not contain the tests, they're published on GitHub only.

You may visit https://github.com/Mithgol/node-fidonet-jam#readme occasionally to read the latest `README` because the package's version is not planned to grow after changes when they happen in `README` only. (However, `npm publish --force` may happen eventually.)

## Using Fidonet JAM

When you `require()` the installed module, you get a constructor that uses the path to a JAM echo base as its parameter:

```js
var JAM = require('fidonet-jam');
var echobase = JAM(basePath);
```

The constructed object has the following methods:

### readJHR(callback)

Asynchronously reads the `.jhr` file (JAM headers) into memory, populating the object's `.JHR` property with a raw Buffer. Then calls `callback(error)`.

The data is cached. Subsequent calls to `.readJHR` won't repeat the reading operation unless the object's `.JHR` property is `null`.

### readJDX(callback)

Asynchronously reads the `.jdx` file (JAM index) into memory and parses that index, populating the object's `.indexStructure` property with an array of `{'ToCRC': ..., 'offset': ...}` objects. Then calls `callback(error)`.

The data is cached. Subsequent calls to `.readJDX` won't repeat the reading operation unless the object's `.indexStructure` property is `null`.

### size()

Returns `.indexStructure.length` property (or `undefined` when `.indexStructure` is `null`).

### clearCache()

Writes `null` to the `JHR` and `indexStructure` properties of the object.

The memory cache becomes empty and thus the next `readJHR` or `readJDX` will read the data from the disk again.

### readFixedHeaderInfoStruct(callback)

Asynchronously reads the “JAM fixed header” of the echo base (calling `.readJHR` method in the process).

Then calls `callback(error, data)`. That `data` is an object with the following properties:

* `Signature` is a four-bytes Buffer (should contain `'JAM\0'`).

* `datecreated` is the (32 bit) creation date of the base.

* `modcounter` is the (32 bit) counter that (according to the JAM specifications) must be incremented and updated on disk each time an application modifies the contents of the message base. (When it reaches `0xffffffff`, it wraps to zero.)

* `activemsgs` is the (32 bit) number of active (i.e. not deleted) messages in the base.

* `passwordcrc` is the (32 bit) CRC-32 of a password to access.

* `basemsgnum` is the (32 bit) lowest message number in the index file.

According to the JAM specifications, the `basemsgnum` property determines the lowest message number in the index file. The value for this field is one (`1`) when a message area is first created. By using this property, a message area can be packed (when deleted messages are removed) without renumbering it. For example, if BaseMsgNum contains `500`, then the first index record points to message number 500.

This property has to be taken into account when an application calculates the next available message number (for creating new messages) as well as the highest and lowest message number in a message area.

### readHeader(number, callback)

Asynchronously reads a JAM header by its number (calling `.readJDX` and `.readJHR` methods in the process).

The headers are treated as numbered from (and including) `1` to (and including) `.size()`, i.e. the `basemsgnum` (see above) is ignored. If the given number is below zero or above `.size()`, then `callback(new Error(…))` is called (see the error codes in the bottom of `fidonet-jam.js`).

The callback has the form `callback(error, header)`. That `header` has the following structure:

* `Signature` is a four-bytes Buffer (should contain `'JAM\0'`).

* `Revision` is the (16 bit) revision level of the header (`1` in the known JAM specification).

* `ReservedWord` is the (16 bit) value reserved for some future use.

* `SubfieldLen` is the (32 bit) length of the `Subfields` data (see below), given in bytes.

* `TimesRead` is the (32 bit) number of times the message was read.

* `MSGIDcrc` and `REPLYcrc` are the (32 bit) CRC-32 values of the MSGID and REPLY lines of the message.

* `ReplyTo`, `Reply1st` and `Replynext` are the (32 bit) values that are used in saving the tree of replies to a message (as seen in the bottom of the JAM specs).

* `DateWritten`, `DateReceived` and `DateProcessed` are the (32 bit) timestamps of the moments when the message was written, received and processed by a tosser (or a scanner).

* `MessageNumber` is the (32 bit, 1-based) number of the message. Should be equal to the `number` parameter given to the `.readHeader` method (though can be different, because `.readHeader` uses the message's position in `.indexStructure` instead of scanning the headers).

* `Attribute` is the (32 bit) bitfield containing the message's attributes.

* `Attribute2` is the (32 bit) value reserved for some future use.

* `Offset` and `TxtLen` are the (32 bit) offset and length of the message's text in the `.jdt` file.

* `PasswordCRC` is the (32 bit) CRC-32 values of the password necessary to access the message.

* `Cost` is the (32 bit) cost value of the message.

* `Subfields` is an array of message's fields. Each of its elements is an object that has the following structure:
   * `LoID` is the (16 bit) identifier of the field's type.
   * `HiID` is the (16 bit) value reserved for some future use.
   * `datlen` is the (32 bit) length of the field.
   * `Buffer` is the Node.js Buffer containing the field's data.
   * `type` is the JavaScript string corresponing to the value of `LoID` (i.e. containing the field's type).

The following `LoID / type` pairs are possible:

* `0 / 'OADDRESS'` — The network address of the message's origin.
* `1 / 'DADDRESS'` — The network address of the message's destination.
* `2 / 'SENDERNAME'` — The sender (author) of the message.
* `3 / 'RECEIVERNAME'` — The recepient of the message.
* `4 / 'MSGID'` — The ID of the message.
* `5 / 'REPLYID'` — If the message is a reply to some other message, contains the MSGID of that message.
* `6 / 'SUBJECT'` — The subject of the message.
* `7 / 'PID'` — The PID of the program that generated the message.
* `8 / 'TRACE'` — Information about a system which the message has travelled through.
* `9 / 'ENCLOSEDFILE'` — A name of a file attached to the message.
* `10 / 'ENCLOSEDFILEWALIAS'` — Same as `'ENCLOSEDFILE'`, but the filename is followed by `\0` and intended to be transmited to the remote system in place of the local name of the file.
* `11 / 'ENCLOSEDFREQ'` — A request for one or more files.
* `12 / 'ENCLOSEDFILEWCARD'` — Same as `'ENCLOSEDFILE'`, but may contain wildcards.
* `13 / 'ENCLOSEDINDIRECTFILE'` — Same as `'ENCLOSEDFILE'`, but indirectly (the filename points to an ASCII file containing one filename entry per line).
* `1000 / 'EMBINDAT'` — Reserved for some future use.
* `2000 / 'FTSKLUDGE'` — FTS-compliant “kludge” line (not otherwise represented here).
* `2001 / 'SEENBY2D'` — Two-dimensional (`net/node`) SEEN-BY information.
* `2002 / 'PATH2D'` — Two-dimensional (`net/node`) PATH information.
* `2003 / 'FLAGS'` — FTN `FLAGS` kludge (stripped from the flags that have binary representation in the JAM message header).
* `2004 / 'TZUTCINFO'` — Time zone information in `+HHmm` or `-HHmm` form (for example, `-0400`) where `+` may be omitted.
* `other / 'UNKNOWN'` — A value not documented in the JAM documentation.

The above description of possible `type` values is abridged (you may read the JAM documentation for details).

Here's a header's screenshot for example:

![(screenshot)](https://f.cloud.github.com/assets/1088720/1190661/8bed90ee-243a-11e3-98db-386ff496f5d2.gif)

### readAllHeaders(callback)

Asynchronously reads all JAM headers from the base (calling `.readJDX` and `.readJHR`, `.readFixedHeaderInfoStruct` and `.readHeader` methods in the process). Then calls `callback(error, data)`. That `data` is an object with the following properties:

* `FixedHeader` is the header asynchronously read by the `.readFixedHeaderInfoStruct` method.

* `MessageHeaders` is an array containing JAM headers of the individual messages as returned by `.readHeader`.

**Note 1: ** as in any other JavaScript array, the indexes of `MessageHeaders` are 0-based, while the `number` parameter of the `.readHeader` method and the `.MessageNumber` property of the header are 1-based.

**Note 2: ** scanning of the whole base takes some time. As tests show, almost a second (or several seconds on an older computer or older Node.js engine) is necessary to scan even a single echo base containing 9151 messages. To avoid freezing of the Node.js event loop, each `.readHeader` call is postponed with `setImmediate()` (or with `process.nextTick()` in older versions of Node.js that lack `setImmediate()`).

### encodingFromHeader(header)

Searches the `Subfields` array of the given `header` for its `FTSKLUDGE`-type subfields (i.e. for FTS control lines aka kludges) and returns the lowercase encoding of the corresponding message (such as `'cp866'` for example) according to the [FTS-5003.001](http://ftsc.org/docs/fts-5003.001) standard:

* For the first `CHRS: <identifier> <level>` or `CHARSET: <identifier> <level>` kludge found, its `identifier` value is lowercased and returned.

* If the identifier has the `'ibmpc'` value, a search for a `CODEPAGE: <identifier> <level>` kludge is performed. If found, the `identifier` value of the first such kludge is lowercased and returned instead of `'ibmpc'`.

* If the identifier has the `'+7_fido'` value, the `'cp866'` value is returned instead of `'+7_fido'`.

* The ` <level>` part is ignored even if present.

* If neither `CHRS: <identifier> <level>` nor `CHARSET: <identifier> <level>` kludge is found, `null` is returned.

Additionally, `'utf-8'` returned value is replaced with `'utf8'`. (This has nothing to do with FTS, but makes the returned value more compatible with the corresponding Node.js Buffer's encoding.)

## Locking files

The module does not lock any files and does not create any “lock files” (flag files, semaphore files). The module's caller should control the access to the message base.

That's because Fidonet software uses different locking methods. For example, GoldED+ uses OS file locking (as seen in its [source code](http://golded-plus.cvs.sourceforge.net/viewvc/golded-plus/golded%2B/goldlib/gall/gfilport.cpp?revision=1.5&view=markup)) and HPT uses a lock file (the file's name is given on the `LockFile` line in the HPT's config). It would complicate the module if it were the module's job to know what locking is necessary.

## Testing Fidonet JAM

[![(build testing status)](https://travis-ci.org/Mithgol/node-fidonet-jam.png?branch=master)](https://travis-ci.org/Mithgol/node-fidonet-jam)

The tests currently contain ≈14 megabytes of input data and thus are not included in the npm package of the module. Use the version from GitHub.

It is necessary to install [Mocha](http://visionmedia.github.io/mocha/) and [JSHint](http://jshint.com/) for testing.

* You may install Mocha globally (`npm install mocha -g`) or locally (`npm install mocha` in the directory of the Fidonet JAM module).

* You may install JSHint globally (`npm install jshint -g`) or locally (`npm install jshint` in the directory of the Fidonet JAM module).

After that you may run `npm test` (in the directory of the Fidonet JAM module).

## TODO

The package's development is still in progress and leaves a lot to be desired:

* Better API (and documented in README).

* Reading messages (not only headers).

* Trees of replies.

* [FGHI](https://github.com/Mithgol/FGHI-URL) support.