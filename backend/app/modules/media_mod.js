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
 * parsePdf - Parses a pdf file and returns the content, split by whitespace
 * @param {String} _filepath the path where the pdf file exists
 * @return {Promise<String[]>} array of pdf text content
 */
var parsePdf = function(_filepath) {
  const SOURCE = 'parsePdf()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    // Load the pdf file and start the parse
    parser.loadPDF(_filepath);
    parser.on('pdfParser_dataError', parseError => reject(parseError));
    parser.on('pdfParser_dataReady', (pdfData) => {
      // Split the raw text into strings and store into an array
      let textArray = parser.getRawTextContent().split(/\s+/);
      resolve(textArray);
    });
  });
};

/**
 * add - Adds an image
 * @param {String} _filename the name of the file
 * @param {Object} _fileJson the file attributes JSON from multer
 */
var add = function(_filename, _fileJson) {
  const SOURCE = 'add()';
  log(SOURCE);
};

/**
 * get - Gets an image
 * @param {String} _filename the name of the file
 */
var get = function(_filename) {
  const SOURCE = 'get()';
  log(SOURCE);
};

/**
 * DELETE - Deletes an image
 * @param {String} _filename the name of the file
 */
var DELETE = function(_filename) {
  const SOURCE = 'DELETE()';
  log(SOURCE);
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
  ADD: add,
  GET: get,
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
