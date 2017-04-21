const uuidV4 = require('uuid/v4');

module.exports = {
  'secret': uuidV4(),
  'database': 'mongodb://localhost/userDB'
};
