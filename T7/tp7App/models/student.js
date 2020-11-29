var mongoose = require('mongoose')

var studentSchema = new mongoose.Schema({
    number: String,
    name: String,
    git: String,
    tpc: [Number]
});

module.exports = mongoose.model('student', studentSchema)