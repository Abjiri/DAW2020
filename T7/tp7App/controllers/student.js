// Student controller

var Student = require('../models/student')

// Returns student list
list = () => {
    return Student
        .find()
        .sort({number:1})
        .exec()
}

lookUp = id => {
    return Student
        .findOne({number: id})
        .exec()
}

insert = student => {
    var newStudent = new Student(student)
    return newStudent.save()
}

edit = (id, student) => {
    return Student
        .replaceOne({number: id}, student)
        .exec()
}

remove = id => {
    return Student
        .remove({number: id})
        .exec()
}

module.exports = {
    list,
    lookUp,
    insert,
    edit,
    remove
}