var express = require('express');
var bodyParser = require('body-parser');
var templates = require('./html-templates');
var jsonFile = require('jsonfile');
var logger = require('morgan');
var fs = require('fs');

var multer = require('multer');
var upload = multer({dest: './uploads'});

var app = express();


app.use(logger('dev'));

app.use(bodyParser.urlencoded({extended:false}));

app.use(bodyParser.json());

app.use(express.static('./public'));

app.get('/', (req,res) => {
    var d = new Date().toISOString().substr(0,16);
    var files = jsonFile.readFileSync('./dbFiles.json');
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.write(templates.fileList(files,d));
    res.end();
})

app.get('/files/upload', (req,res) => {
    var d = new Date().toISOString().substr(0,16);
    res.writeHead(200,{'Content-Type': 'text/html; charset=utf-8'});
    res.write(templates.fileForm(d));
    res.end();
})

app.get('/files/download/:fname', (req,res) => {
    res.download(__dirname + '/public/fileStore/' + req.params.fname);  
})

app.post('/files', upload.array('myFile'), (req,res) => {
    var files = jsonFile.readFileSync('./dbFiles.json');
    var date = new Date().toISOString().substr(0,16);

    for (var i = 0; i < req.files.length; i++) {
        try {
            let oldPath = __dirname + '/' + req.files[i].path;
            let newPath = __dirname + '/public/fileStore/' + req.files[i].originalname;

            fs.rename(oldPath, newPath, (err) => {
                if (err) throw err;
            });

            files.push({
                date,
                name: req.files[i].originalname,
                size: req.files[i].size,
                mimetype: req.files[i].mimetype,
                description: req.files.length == 1 ? req.body.description : req.body.description[i]
            });
        } catch (err) {
            console.log("Erro ao renomear um dos ficheiros: " + err);
        }
    }
        
    jsonFile.writeFileSync('./dbFiles.json', files);
    res.redirect('/');
})

app.listen(7700, () => console.log('Servidor a escuta porta 7700...'));