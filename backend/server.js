var express     = require('express'),
    app         = express(),
    PORT        = 8080,
    cors        = require('cors'),
    bodyParser  = require('body-parser'),
    router      = require('./app/router_mod.js')(express.Router()),
    mongoose    = require('mongoose'),
    config      = require('./config/database');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use('/api', router);

mongoose.connect(config.database);

app.listen(PORT, (err) => {
  if (err) {
    return console.log('Server connection error', err);
  }
  console.log(`Epicenter magic happens on port ${PORT}`);
});
