var http = require('http');
var fs = require('fs');

function error(res,msg) { //imprimir mensagem de erro na frontend para o user
    res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
    res.write('<p>'+msg+'</p>');
    res.end();
}

function readFile(res,filename) { //ler ficheiro e mostrar na frontend
    fs.readFile(filename, function(err,data) {
        if (err) {
            console.log(err); //imprimir erro na backend
            error(res,'A leitura do ficheiro correu mal!'); //informar user do erro na frontend
        }
        else {
            res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
            res.write(data);
            res.end();
        }
    })
}

http.createServer(function (req,res) {
    console.log(req.method+' '+req.url);

    if (req.method !== 'GET') { //só quero aceitar pedidos com método GET neste servidor
        error(res,'Método inválido!');
    }
    else if (req.url.match(/^\/$/)) { //se o user aceder ao url base do localhost, redirecionar para o índice
        res.writeHead(301, {location: 'http://localhost:7777/index'}); //301 = 'moved permanently'
        res.end();
    }
    else if (req.url.match(/^\/index$/)) { //url do índice
        readFile(res,'site/index.html');
    }
    else if (req.url.match(/^\/arqs\/[1-9]|[1-9][0-9]|[1]([0-1][0-9]|[2][0-2])$/)) { //url de um arqueossitio
        readFile(res,'site/arq'+req.url.split('/')[2]+'.html');
    }
    else { //url inválido
        error(res,'URL inválido!');
    }
}).listen(7777);

console.log("Servidor à escuta na porta 7777...");
