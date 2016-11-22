var mongoose = require('mongoose');
//var Schema = mongoose.Schema;

var BearSchema = mongoose.Schema({
    //bears name
    name: String
});

module.exports = mongoose.model('Bear',BearSchema);