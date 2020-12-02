var express = require('express');
var multer  = require('multer');
var upload = multer({ dest: 'public/images' });
var router = express.Router();

var Student = require('../controllers/student')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/students');
});

/* GET students listing. */
router.get('/students', function(req, res) {
  Student.list()
    .then(data => res.render('layout', {subpage: 'students', list: data }))
    .catch(err => res.render('layout', {subpage: 'error', error: err}))
});

/* GET register page. */
router.get('/students/register', function(req, res) {
  res.render('layout', {subpage: 'register'});
});

/* GET student page. */
router.get('/students/edit/:id', function(req, res) {
  Student.lookUp(req.params.id)
    .then(student => res.render('layout', {subpage: 'edit', student}))
    .catch(error => res.render('layout', {subpage: 'error', error}))
});

/* GET student page. */
router.get('/students/:id', function(req, res) {
  Student.lookUp(req.params.id)
    .then(student => res.render('layout', {subpage: 'student', student}))
    .catch(error => res.render('layout', {subpage: 'error', error}))
});


/* POST register new student. */
router.post('/students', upload.single('photo'), function(req, res) {
  let { number, name, git } = req.body;
  let student = {};

  student.number = number;
  student.name = name;
  student.git = git;
  student.tpc = [];

  for (var i = 1; i < 9; i++) {
    if (req.body[`tpc${i}`] != undefined) student.tpc.push(1);
    else student.tpc.push(0);
  }

  if (!req.file) {
    console.log("No file received...");
    student.photo = null;
  }
  else student.photo = 'http://localhost:7700/' + req.file.path;

  Student.insert(student);
  res.redirect('/students');
})

/* PUT edit student. */
router.put('/students/:id', upload.single('new_photo'), function(req, res) {
  let { id, number, name, git, photo } = req.body;
  let student = {};

  student.number = number;
  student.name = name;
  student.git = git;
  student.tpc = [];

  for (var i = 1; i < 9; i++) {
    if (req.body[`tpc${i}`] != undefined) student.tpc.push(1);
    else student.tpc.push(0);
  }

  if (!req.file) {
    console.log("No file received...");
    if (!photo.length) student.photo = null;
    else student.photo = photo;
  }
  else student.photo = 'http://localhost:7700/' + req.file.path;

  Student.edit(id,student);
  res.redirect(`/students/${student.number}`);
})

/* DELETE student. */
router.delete('/students/:id', function(req, res) {
  Student.remove(req.params.id);
  res.redirect('/students');
})

module.exports = router;
