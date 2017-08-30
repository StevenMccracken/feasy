/**
 * media_mod - @module for media file uploads like pdfs and images
 */

const FS = require('fs');
const LOG = require('./log_mod');
const Multer = require('multer');
const PdfParser = require('pdf2json');
const UTIL = require('./utility_mod');

// Temporary file download configuration
const UPLOAD_CONFIG = Multer({
  dest: './app/media/pdfs/',
  limits: { fileSize: '10000kb' },
});

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 * @param {Object} _request the HTTP request
 */
function log(_message) {
  LOG.log('Media Module', _message);
}

// initialize pdf2json parser to grab pdf text content as raw
const parser = new PdfParser(this, 1);

/**
 * parsePdf - Parses a pdf file and returns the content, split by whitespace
 * @param {String} _filepath the path where the pdf file exists
 * @return {Promise<String[]>} array of pdf text content
 */
const parsePdf = function parsePdf(_filepath) {
  const SOURCE = 'parsePdf()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    // Load the pdf file and start the parse
    parser.loadPDF(_filepath);
    parser.on('pdfParser_dataError', parseError => reject(parseError));
    /* eslint-disable no-unused-vars */
    parser.on('pdfParser_dataReady', (pdfData) => {
      // Split the raw text into strings and store into an array
      const text = parser.getRawTextContent();
      // const filename = UTIL.newUuid();
      // log(`Writing ${filename}`);
      // FS.writeFile(`./app/media/pdfs/${filename}.txt`, text, (error) => {
      //   if (error) {
      //     log(`Failed writing ${filename} because:`);
      //     console.log(error);
      //   } else log('Successfully wrote ', filename);
      // });

      const textArray = text.split(/\s+/);
      resolve(textArray);
    }); // End parser.on(pdfParser_dataReady)
    /* eslint-enable no-unused-vars */
  }); // End return promise
}; // End parsePdf()

/**
 * removeTempFile - Removes a file from the local filesystem
 * @param {String} _filePath the path to the desired file
 */
const removeTempFile = function removeTempFile(_filePath) {
  const SOURCE = 'removeTempFile()';
  log(`${SOURCE} ${_filePath}`);

  FS.unlink(_filePath, (unlinkError) => {
    if (UTIL.hasValue(unlinkError)) {
      log(`${SOURCE}: Failed removing temp file at ${_filePath} because ${unlinkError}`);
    } else log(`${SOURCE}: Removed temp file at ${_filePath}`);
  }); // End FS.unlink()
}; // End removeTempFile()

module.exports = {
  parsePdf,
  upload: UPLOAD_CONFIG,
  removeTempFile,
};
