var axios = require('axios');

function badRequest(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
    res.write(`<p>Pedido não suportado: ${req.method} ${req.url}</p>`);
    res.end();
}

function pageNotFound(collection, page, res) {
    console.log(`A página ${page} de ${collection} não existe!`);

    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
    res.write(`<p>A página ${page} de ${collection} não existe!</p>`);

    footer(res);
}

function index(res) {
    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
    res.write('<h2>Escola de Música</h2>');
    res.write('<ul>');
    res.write('<li><a href="/alunos">Lista de alunos</a></li>');
    res.write('<li><a href="/cursos">Lista de cursos</a></li>');
    res.write('<li><a href="/instrumentos">Lista de instrumentos</a></li>');
    res.write('</ul>');
    res.end();
}

//processa o campo links que vem nos headers da response
function getLinks(data) {
    var links = {};

    //remover os espaços da string e dividi-la por vírgulas
    data.replace(/\s/g, '').split(',').forEach(l => {
        let split = l.split(';'), //separar os dois componentes de cada link
            linkName = split[1].split('"')[1], //nome da página correspondente ao link em questão (first,last,...)
            link = split[0].substring(1).slice(0,-1).replace('3001','4000').split('&')[0]; //link na porta do servidor node

        links[linkName] = link; //guardar no objeto correspondência entre o nome da página e o seu link
    });

    return links;
}

function studentInfo(s, res) {
    res.write(`<p><b>Número mecanográfico:</b> ${s.id}</p>`);
    res.write(`<p><b>Nome:</b> ${s.nome}</p>`);
    res.write(`<p><b>Data de nascimento:</b> ${s.dataNasc}</p>`);
    res.write(`<p><b>Curso:</b> <a href="/cursos/${s.curso}">${s.curso}</a></p>`);
    res.write(`<p><b>Ano:</b> ${s.anoCurso}</p>`);
    res.write(`<p><b>Instrumento:</b> ${s.instrumento}</p>`);
}

function courseInfo(c, res) {
    res.write(`<p><b>Identificador:</b> ${c.id}</p>`);
    res.write(`<p><b>Designação:</b> ${c.designacao}</p>`);
    res.write(`<p><b>Duração (em anos):</b> ${c.duracao}</p>`);
    res.write(`<p><b>Instrumento:</b> <a href="/instrumentos/${c.instrumento.id}">${c.instrumento['#text']}</a></p>`);
}

function instrumentInfo(i, res) {
    res.write(`<p><b>Identificador:</b> ${i.id}</p>`);
    res.write(`<p><b>Designação:</b> ${i['#text']}</p>`);
}

function footer(res) {
    res.write(`<p><address>[ <a href="/">Início</a> ]</address></p>`);
    res.end();
}

function getCollectionIndex(collection, req, res, page) {
    var sort = collection == 'cursos' ? '&_sort=id' : '';

    axios.get('http://localhost:3001/' + collection + '?_page=' + page + sort)
    .then(resp => {
        if (!resp.data.length) pageNotFound(collection, page, res);
        else {
            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
            res.write(`<h2>Escola de Música: ${collection.charAt(0).toUpperCase()+collection.slice(1)}</h2>`);
            res.write('<ul>');

            for (var i = 0; i < resp.data.length; i++) {
                let e = resp.data[i];

                var li;
                switch(collection) {
                    case 'alunos': li = `<li><a href="/alunos?_page=${page}/${e.id}">${e.id} - ${e.nome}</a></li>`; break;
                    case 'cursos': li = `<li><a href="/cursos?_page=${page}/${e.id}">${e.id} - ${e.designacao}</a></li>`; break;
                    case 'instrumentos': li = `<li><a href="/instrumentos?_page=${page}/${e.id}">${e.id} - ${e['#text']}</a></li>`; break;
                }
                res.write(li);
            }
            res.write('</ul>');

            let links = getLinks(resp.headers['link']),
                prev = links['prev'] ? `<a href="${links['prev']}">Anterior</a>` : '-',
                next = links['next'] ? `<a href="${links['next']}">Seguinte</a>` : '-';

            res.write(`<p>[ ${prev} | ${next} ]</p>`);

            footer(res);
        }
    })
    .catch(error => {
        console.log(`Erro na obtenção da lista de ${collection}: ` + error);
        badRequest(req,res);
    });
}

function getCollectionElem(url, res) {
    var split = url.split('/'),
        collection = split[1].includes('?') ? split[1].split('?')[0] : split[1],
        id = split[2];

    axios.get(`http://localhost:3001/${collection}/${id}`)
        .then(resp => {
            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
            
            if (collection == 'alunos') studentInfo(resp.data, res);
            if (collection == 'cursos') courseInfo(resp.data, res);
            if (collection == 'instrumentos') instrumentInfo(resp.data, res);

            res.write('<br>');
            res.write(`<p><address>[ <a href="/${split[1]}">Lista de ${collection}</a> ]</address>`);
            footer(res);
        })
        .catch(error => {
            var elem = collection.slice(0,-1);

            console.log(`Erro na obtenção do ${elem} ${id}: error`);

            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
            res.write(`<p>O ${elem} ${id} não existe!</p>`);

            footer(res);
        });
}

module.exports = {
    badRequest,
    index,
    getCollectionIndex,
    getCollectionElem
}