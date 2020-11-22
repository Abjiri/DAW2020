/*
    Module Static - to serve static resources in public folder
    Exports: 
        Bool recursoEstatico(request) - tells if someone is asking a static resource
        Data sirvoRecursoEstatico(req, res) - returns the resource
*/

var fs = require('fs')

function staticResource(request){
    return  /\/w3.css$/.test(request.url) || 
            /\/favicon.png$/.test(request.url);
}

function serveStaticResource(req, res){
    var split = req.url.split('/');
    var file = split[split.length -1 ];

    fs.readFile('public/' + file, (error, data) => {
        if (error) {
            console.log('Erro: ficheiro não encontrado ' + error);
            res.statusCode = 404;
            res.end();
        }
        else {
            if (file == '/favicon.ico')
                res.setHeader('Content-Type', 'image/x-icon');
            res.end(data)
        }
    })
}

module.exports = {
    staticResource,
    serveStaticResource
}