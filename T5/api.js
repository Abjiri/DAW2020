var axios = require('axios');

//mensagem de pedido inválido na frontend
function badRequest(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
    res.write(`<p>Pedido não suportado: ${req.method} ${req.url}</p>`);
    res.end();
}

//mensagem de página não encontrada, frontend e backend
function pageNotFound(collection, page, res) {
    console.log(`A página ${page} de ${collection} não existe!`);

    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
    res.write(`<p>A página ${page} de ${collection} não existe!</p>`);

    footer(res);
}

//índice principal
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

//informação da página de estudante
function studentInfo(s, res) {
    res.write(`<p><b>Número mecanográfico:</b> ${s.id}</p>`);
    res.write(`<p><b>Nome:</b> ${s.nome}</p>`);
    res.write(`<p><b>Data de nascimento:</b> ${s.dataNasc}</p>`);
    res.write(`<p><b>Curso:</b> <a href="/cursos/${s.curso}">${s.curso}</a></p>`);
    res.write(`<p><b>Ano:</b> ${s.anoCurso}</p>`);
    res.write(`<p><b>Instrumento:</b> ${s.instrumento}</p>`);
}

//informação da página de curso
function courseInfo(c, res) {
    res.write(`<p><b>Identificador:</b> ${c.id}</p>`);
    res.write(`<p><b>Designação:</b> ${c.designacao}</p>`);
    res.write(`<p><b>Duração (em anos):</b> ${c.duracao}</p>`);
    res.write(`<p><b>Instrumento:</b> <a href="/instrumentos/${c.instrumento.id}">${c.instrumento['#text']}</a></p>`);
}

//informação da página de instrumento
function instrumentInfo(i, res) {
    res.write(`<p><b>Identificador:</b> ${i.id}</p>`);
    res.write(`<p><b>Designação:</b> ${i['#text']}</p>`);
}

//rodapé comum à maior parte das páginas, com referência para o índice principal
function footer(res) {
    res.write(`<p><address>[ <a href="/">Início</a> ]</address></p>`);
    res.end();
}

//página com elementos de uma certa coleção
function getCollectionIndex(collection, req, res, page) {
    var sort = collection == 'cursos' ? '&_sort=id' : ''; //o caso dos cursos é o único qu não está já ordenado por ordem alfabética

    axios.get('http://localhost:3001/' + collection + '?_page=' + page + sort) //pedido para o json-server
    .then(resp => {
        if (!resp.data.length) pageNotFound(collection, page, res); //se não tiver elementos, a página é inválida
        else {
            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
            res.write(`<h2>Escola de Música: ${collection.charAt(0).toUpperCase()+collection.slice(1)}</h2>`);
            res.write('<ul>');

            for (var i = 0; i < resp.data.length; i++) {
                let e = resp.data[i];

                var li;
                //imprimir os elementos da coleção em questão
                switch(collection) {
                    case 'alunos': li = `<li><a href="/alunos?_page=${page}/${e.id}">${e.id} - ${e.nome}</a></li>`; break;
                    case 'cursos': li = `<li><a href="/cursos?_page=${page}/${e.id}">${e.id} - ${e.designacao}</a></li>`; break;
                    case 'instrumentos': li = `<li><a href="/instrumentos?_page=${page}/${e.id}">${e.id} - ${e['#text']}</a></li>`; break;
                }
                res.write(li);
            }
            res.write('</ul>');

            //ir buscar os links para as páginas relevantes da coleção
            let links = getLinks(resp.headers['link']),
                first = `<a href="${links['first']}">Primeira página</a>`,
                prev = links['prev'] ? `<a href="${links['prev']}">Anterior</a>` : '-',
                next = links['next'] ? `<a href="${links['next']}">Seguinte</a>` : '-',
                last = `<a href="${links['last']}">Última página</a>`;

            res.write(`<p>[ ${first} | ${prev} | ${next} | ${last} ]</p>`);

            footer(res);
        }
    })
    .catch(error => {
        console.log(`Erro na obtenção da lista de ${collection}: ` + error);
        badRequest(req,res);
    });
}

//página com informação de um elemento da coleção
function getCollectionElem(url, res) {
    //extrai a coleção em questão e o id do elemento do url
    var split = url.split('/'),
        collection = split[1].includes('?') ? split[1].split('?')[0] : split[1],
        id = split[2];

    axios.get(`http://localhost:3001/${collection}/${id}`) //pedido para o json-server
        .then(resp => {
            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
            
            //imprimir informação do elemento em questão
            if (collection == 'alunos') studentInfo(resp.data, res);
            if (collection == 'cursos') courseInfo(resp.data, res);
            if (collection == 'instrumentos') instrumentInfo(resp.data, res);

            res.write('<br>');
            -
            //link para a coleção em questão (e a página em específico deste element, se estiver no link)
            res.write(`<p><address>[ <a href="/${split[1]}">Lista de ${collection}</a> ]</address>`);
            footer(res);
        })
        .catch(error => {
            //mensagem de erro de obtenção de elemento com id inválido, frontend e backend
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