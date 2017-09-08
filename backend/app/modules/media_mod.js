/**
 * media_mod - @module for media file uploads like pdfs and images
 */

const FS = require('fs');
const LOG = require('./log_mod');
const Multer = require('multer');
const PdfParser = require('pdf2json');
const UTIL = require('./utility_mod');
const PYTHON = require('python-shell');

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

/**
 * parsePdf - Parses a pdf file and returns the content, split by whitespace
 * @param {String} _filepath the path where the pdf file exists
 * @return {Promise<String>} the pure pdf text content
 */
const parsePdf = function parsePdf(_filepath) {
  const SOURCE = 'parsePdf()';
  log(SOURCE);

  return new Promise((resolve, reject) => {
    // Initialize pdf2json parser
    const parser = new PdfParser(this, 1);

    // Load the pdf file and start the parse
    parser.loadPDF(_filepath);
    parser.on('pdfParser_dataError', parseError => reject(parseError));
    /* eslint-disable no-unused-vars */
    parser.on('pdfParser_dataReady', (pdfData) => {
    /* eslint-disable no-unused-vars */
      // Get the raw text content from the pdf data structure
      const rawText = parser.getRawTextContent();

      // Remove the page break symbols that pdfParser added
      const pageBreaksRemovedText = rawText.replace(/[-]{16}Page \(\d*\) Break[-]{16}/g, '');

      // Remove all line-delimiting characters from the string
      const pureText = pageBreaksRemovedText.replace(/(?:\r\n|\r|\n|\t)/g, ' ');

      // const textArray = text.split(/\s+/);
      resolve(pureText);
    }); // End parser.on(pdfParser_dataReady)
  }); // End return promise
}; // End parsePdf()

/**
 * pythonParse - Spawns a python process to analyze dates within a given string of text
 * @param {String} [_text=''] the text to parse and analyze
 * @return {any} the results of the parsing
 */
const pythonParse = function pythonParse(_text = '') {
  const SOURCE = 'pythonParse()';
  log(SOURCE);

  const promise = new Promise((resolve, reject) => {
    // Encoded the text as a UTF-8 string for the python script
    // const utf8Encoded = UTIL.utf8.encode(_text);
    try {
      // Create the options for the python script to accept text arguments
      const currentWorkingDirectory = process.cwd();
      const scriptOptions = {
        mode: 'text',
        scriptPath: `${currentWorkingDirectory}/../python/`,
        args: ['-text', _text],
      };

      PYTHON.run('script.py', scriptOptions, (scriptError, results) => {
        if (UTIL.hasValue(scriptError)) reject(scriptError);
        else {
          let cleanResult;
          // Remove redundant escape characters and extra \x characters for UTF-8
          if (Array.isArray(results)) {
            const length = results.length;
            if (length === 0) cleanResult = '';
            else {
              const actualResult = results[length - 1];
              cleanResult = actualResult.replace(/\\x/gi, '\\');
            }
          } else if (typeof results === 'string') cleanResult = results.replace(/\\x/g, '\\');
          else cleanResult = results;

          resolve(cleanResult);
        }
      });
    } catch (pythonError) {
      reject(pythonError);
    }
  }); // End promise

  return promise;
}; // End pythonParse()

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
  pythonParse,
  upload: UPLOAD_CONFIG,
  removeTempFile,
};
