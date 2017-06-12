var path = require('path');
var express = require('express');

var app = express();
app.use('/', express.static(path.join(__dirname, '../dist')));
app.listen(3000, () => {
  console.log('Frontend server is listening on port 3000');
});
