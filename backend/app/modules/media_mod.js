/**
 * media_mod - @module for media file uploads like pdfs and images
 */

const FS = require('fs');
const LOG = require('./log_mod');
const Multer = require('multer');
const PdfParser = require('pdf2json');

// Temporary file download configuration
const UPLOAD_CONFIG = Multer({
  dest: './app/media/pdfs/',
  limits: { fileSize: '10000kb' },
});

// initialize pdf2json parser to grab pdf text content as raw
const parser = new PdfParser(this, 1);

/**
 * ADD - Uploads an image to cloud storage
 * @param {String} _filename the name of the file (usually a dropp id)
 * @param {Object} _fileJson the file attributes JSON from multer
 * @param {callback} _callback the callback to return the result
 * @param {callback} _errorCallback the callback to handle any errors
 */
var ADD = function(_filename, _fileJson, _callback, _errorCallback) {
  const SOURCE = 'ADD()';
  log(SOURCE);

  let localReadStream = FS.createReadStream(_fileJson.path);
  // let remoteWriteStream = BUCKET.file(_filename).createWriteStream();
  // localReadStream.pipe(remoteWriteStream);
  //
  // remoteWriteStream.on('error', uploadError => _errorCallback(uploadError));
  // remoteWriteStream.on('finish', () => _callback());
};

var parsePdf = function(_filepath, _callback, _errorCallback) {
  const SOURCE = 'parsePdf()';
  log(SOURCE);

  parser.loadPDF(_filepath);
  parser.on('pdfParser_dataError', parseError => _errorCallback(parseError));
  parser.on('pdfParser_dataReady', (pdfData) => {
    // Split the raw text into strings and store into an array
    let textArray = parser.getRawTextContent().split(/\s+/);
    _callback(textArray);
  });
}

/**
 * GET - Downloads an image from cloud storage
 * @param {String} _filename the name of the file (usually a dropp id)
 * @param {Boolean} _platformIsReactNative determines if the image should be encoded in base-64
 * @param {callback} _callback the callback to return the result
 * @param {callback} _errorCallback the callback to handle any errors
 */
var GET = function(_filename, _platformIsReactNative, _callback, _errorCallback) {
  const SOURCE = 'GET()';
  log(SOURCE);

  // let remoteReadStream = BUCKET.file(_filename).createReadStream();
  //
  // // Catch error event while downloading
  // remoteReadStream.on('error', (downloadError) => {
  //   // var error, clientMessage, serverLog;
  //   if (downloadError.code === 404) _callback(null);
  //   else _errorCallback(downloadError);
  // });
  //
  // // Download bytes from google cloud storage reference to local memory array
  // let data = [];
  // remoteReadStream.on('data', datum => data.push(datum));
  //
  // // Catch finish event after downloading has finished
  // remoteReadStream.on('end', () => {
  //   // Create buffer object from array of bytes
  //   let buffer = Buffer.concat(data);
  //
  //   if (_platformIsReactNative) {
  //     encodeForReactNative(buffer, base64String => _callback({ media: base64String }));
  //   } else _callback({ media: buffer });
  // });
};

/**
 * DELETE - Removes an image from cloud storage
 * @param {String} _filename the name of the file (usually a dropp id)
 * @param {callback} _callback the callback to handle finish event
 * @param {callback} _errorCallback the callback to handle error event
 */
var DELETE = function(_filename, _callback, _errorCallback) {
  const SOURCE = 'DELETE()';
  log(SOURCE);

  log(`${SOURCE}: Trying to delete image '${_filename}'`);
  // let image = BUCKET.file(_filename);
  // if (image !== null) {
  //   image.delete().then((response) => {
  //     log(`${SOURCE}: Successfully deleted image '${_filename}'`);
  //     _callback(true);
  //   })
  //   .catch((deleteImageError) => {
  //     log(`${SOURCE}: Failed deleting image '${_filename}' because: ${deleteImageError}`);
  //     _errorCallback(deleteImageError);
  //   });
  // } else {
  //   log(`${SOURCE}: Image '${_filename}' does not exist`);
  //   _callback(false);
  // }
};

/**
 * removeTempFile - Removes a file from the local filesystem
 * @param {String} _filePath the path to the desired file
 */
var removeTempFile = function(_filePath) {
  const SOURCE = 'removeTempFile()';
  log(`${SOURCE} ${_filePath}`);

  FS.unlink(_filePath, (unlinkError) => {
    if (unlinkError) {
      log(`${SOURCE}: Failed removing temp file at ${_filePath} because ${unlinkError}`);
  } else log(`${SOURCE}: Removed temp file at ${_filePath}`);
  });
};

module.exports = {
  parsePdf: parsePdf,
  upload: UPLOAD_CONFIG,
  ADD: ADD,
  GET: GET,
  DELETE: DELETE,
  removeTempFile: removeTempFile,
};

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 * @param {Object} _request the HTTP request
 */
function log(_message) {
  LOG.log('Media Module', _message);
}
