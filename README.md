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

### readAllHeaders(callback)

Asynchronously reads all JAM headers from the base (calling `.readJDX` and `.readJHR` methods in the process) and parses them. Then calls `callback(error, data)`. That `data` is an object with the following properties:

* `FixedHeader` is the header asynchronously read by the `.readFixedHeaderInfoStruct()` method.

* `MessageHeaders` is an array containing JAM headers of the individual messages.

Scanning the whole base takes some time. As tests show, almost a second (or several seconds on an older computer or older Node.js engine) is necessary to scan even a single echo base containing 8222 messages.

Each of the returned headers has the following structure (the values of the last header in the test JAM base are shown):

![(screenshot)](https://f.cloud.github.com/assets/1088720/1190661/8bed90ee-243a-11e3-98db-386ff496f5d2.gif)

## Locking files

The module does not lock any files and does not create any “lock files” (flag files, semaphore files). The module's caller should control the access to the message base.

That's because Fidonet software uses different locking methods. For example, GoldED+ uses OS file locking (as seen in its [source code](http://golded-plus.cvs.sourceforge.net/viewvc/golded-plus/golded%2B/goldlib/gall/gfilport.cpp?revision=1.5&view=markup)) and HPT uses a lock file (the file's name is given on the `LockFile` line in the HPT's config). It would complicate the module if it were the module's job to know what locking is necessary.

## Testing Fidonet JAM

[![(build testing status)](https://travis-ci.org/Mithgol/node-fidonet-jam.png?branch=master)](https://travis-ci.org/Mithgol/node-fidonet-jam)

The tests currently contain ≈2 megabytes of input data and thus are not included in the npm package of the module. Use the version from GitHub.

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