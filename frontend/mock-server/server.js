var express = require('express');
var app = express();


var path = require('path');

//var multer = require('multer');

app.use('/', express.static(path.join(__dirname, '../dist')));

app.listen(3000, "0.0.0.0", function(){
  console.log('Express has started listening to port 3000')
});
