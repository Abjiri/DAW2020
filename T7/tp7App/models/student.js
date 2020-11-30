var mongoose = require('mongoose')

var studentSchema = new mongoose.Schema({
    number: String,
    name: String,
    git: String,
    tpc: [Number],
    photo: String
});

module.exports = mongoose.model('student', studentSchema)