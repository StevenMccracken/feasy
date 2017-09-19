/**
 * sendGrid_mod - @module for interacting with SendGrid APIs
 */

const LOG = require('./log_mod');
const SG = require('@sendgrid/mail');
const VALIDATE = require('./validation_mod');
const CONFIG = require('../../config/sendGridSecret');

// Configure the API key
SG.setApiKey(CONFIG.apiKey);

/**
 * log - Logs a message to the server console
 * @param {String} _message the log message
 */
function log(_message) {
  LOG.log('SendGrid API Module', _message);
}

/**
 * Sends pure text content in an email message
 * @param {String} _to the email address to send the email message to
 * @param {[type]} [_subject = ''] the subject line of the email message
 * @param {[type]} [_text = ''] the text content for the email message to contain
 * @return {Promise<any>} the result of the email that was sent
 */
const sendText = function sendText(_to, _subject = '', _text = '') {
  const SOURCE = 'sendText()';
  log(SOURCE);

  const promise = new Promise((resolve, reject) => {
    const message = {
      to: _to,
      from: 'feasyresponse@gmail.com',
      subject: _subject,
      text: _text,
    };

    SG.send(message)
      .then(sendResult => resolve(sendResult)) // End then(sendResult)
      .catch(sendError => reject(sendError)); // End SG.send()
  }); // End create promise

  return promise;
}; // End sendText()

const sendPasswordReset = function sendPasswordReset(_userInfo = {}, _passwordResetUrl = '') {
  const SOURCE = 'sendPasswordReset()';
  log(SOURCE);

  const to = _userInfo.email;
  const subject = 'Reset your password';

  let formalName;
  if (VALIDATE.isValidString(_userInfo.firstName)) formalName = _userInfo.firstName;
  else formalName = _userInfo.username;

  const content = `Hey there ${formalName},\n\nWe're sorry to hear that you forgot your password. Please visit ${_passwordResetUrl} to create a new password.\n\nPlease note that this link will expire in 1 hour.\n\nRegards,\n\nThe Feasy team`;

  const promise = new Promise((resolve, reject) => {
    sendText(to, subject, content)
      .then(sendResult => resolve(sendResult)) // End then(sendResult)
      .catch(sendError => reject(sendError)); // End sendText()
  }); // End create promise

  return promise;
}; // End sendPasswordReset()

module.exports = {
  sendText,
  sendPasswordReset,
};
