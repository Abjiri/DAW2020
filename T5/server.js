var http = require('http');
var api = require('./api');

http.createServer(function (req,res) {
    console.log(req.method + ' ' + req.url);

    if (req.method == 'GET') { //só quero aceitar pedidos com método GET neste servidor
        if (req.url == '/') {
            api.index(res);
        }
        else if (req.url.match(/^\/(alunos|cursos|instrumentos)\/?$/)) {
            api.getCollectionIndex(req.url.split('/')[1], req, res, 1);
        }
        else if (req.url.match(/^\/(alunos|cursos|instrumentos)\?_page=[1-9][0-9]*\/?$/)) {
            let page = req.url.split('=')[1];
            api.getCollectionIndex(req.url.split('/')[1].split('?')[0], req, res, page);
        }
        else if (req.url.match(/^\/alunos\/A[0-9]*\/?$/)
              || req.url.match(/^\/cursos\/C[BS][0-9]*\/?$/)
              || req.url.match(/^\/instrumentos\/I[0-9]*\/?$/)) {
            api.getCollectionElem(req.url,res,1);
        }
        else if (req.url.match(/^\/alunos\?_page=[1-9][0-9]*\/A[0-9]*\/?$/)
              || req.url.match(/^\/cursos\?_page=[1-9][0-9]*\/C[BS][0-9]*\/?$/)
              || req.url.match(/^\/instrumentos\?_page=[1-9][0-9]*\/I[0-9]*\/?$/)) {
            let page = req.url.split('=')[1];
            api.getCollectionElem(req.url,res,page);
        }
        else {
            api.badRequest(req,res);
        }
    }
    else {
        api.badRequest(req,res);
    }
}).listen(4000);

console.log('Servidor à escuta na porta 4000...');