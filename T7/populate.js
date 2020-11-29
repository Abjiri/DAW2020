var students = require('./DAW2020.json');

//Import the mongoose module
var mongoose = require('mongoose');

//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/DAW2020';
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error...'));
db.once('open', function() {
    console.log("Connected to MongoDB successfully...")
});

var studentSchema = new mongoose.Schema({
  number: String,
  name: String,
  git: String,
  tpc: [Number]
});

var studentModel = mongoose.model('students', studentSchema)

studentModel.create(students)

console.log("Database populated!")
