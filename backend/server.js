var express     = require('express');
var app         = express();
var PORT        = 27017;
var cors        = require('cors');
var bodyParser  = require('body-parser');
var router      = require('./app/router_mod.js')(express.Router());
var mongoose    = require('mongoose');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/api', router);

mongoose.connect('mongodb://localhost/userDB', (err) => {
    if (err) {
        console.log('Database connection error', err);
        throw '';
    }
    console.log('Successfully connected to mongodb');
});

// Start listening
app.listen(PORT, (err) => {
    if (err) {
        return console.log('Server connection error', err);
    }
    console.log(`Epicenter magic happens on port ${PORT}`);
});
