var http = require('http');
var axios = require('axios');
var static = require('./static');

var {parse} = require('querystring');

// Aux. Functions
//mensagem de pedido inválido
function badRequest(req, res) {
    console.log(`Pedido não suportado: ${req.method} ${req.url}`);

    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
    res.write(`<p>Pedido não suportado: ${req.method} ${req.url}</p>`);
    res.end();
}

function logError(msg, method, error, res) {
    console.log(msg + ": " + error)

    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
    res.write(`<p>Erro no ${method}: ${error} </p>`);
    res.end();
}

function getCurrentDate() {
    var today = new Date();

    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    var hh = String(today.getHours()).padStart(2, '0');
    var MM = String(today.getMinutes()).padStart(2, '0');

    return dd + '-' + mm + '-' + yyyy + ', ' + hh + ':' + MM;
}

function formatDueDate(date) {
    var datetime = date.split('T');
    var ymd = datetime[0].split('-');
    var hM = datetime[1].split(':');

    return ymd[2] + '-' + ymd[1] + '-' + ymd[0] + ', ' + hM[0] + ':' + hM[1];
}

// Retrieves student info from request body --------------------------------
function getFormData(request, callback){
    if (request.headers['content-type'] == 'application/x-www-form-urlencoded') {
        let body = '';
        request.on('data', bloco => {
            body += bloco.toString();
        })
        request.on('end', () => {
            console.log(body);
            callback(parse(body));
        })
    }
}

function pageHead() {
    return `
    <html>
        <head>
            <title>Lista de tarefas</title>
            <meta charset="utf-8"/>
            <link rel="icon" href="favicon.png"/>
            <link rel="stylesheet" href="w3.css"/>
        </head>
        <body>
    `;
}

function taskForm() {
    return `
        <div class="w3-container w3-teal">
            <h2>Nova tarefa</h2>
        </div>
          
        <form class="w3-container" action="/tasks" method="POST" style="margin-top: 15px">
            <label class="w3-text-teal"><b>Descrição:</b></label>
            <input class="w3-input w3-border w3-light-grey" type="text" name="description" style="margin-bottom: 10px" required>
          
            <label class="w3-text-teal"><b>Responsável:</b></label>
            <input class="w3-input w3-border w3-light-grey" type="text" name="who" style="margin-bottom: 10px" required>

            <label class="w3-text-teal"><b>Prazo:</b></label>
            <input class="w3-input w3-border w3-light-grey" type="datetime-local" name="due" style="margin-bottom: 10px" required>

            <label class="w3-text-teal"><b>Tipo de tarefa:</b></label>
            <select class="w3-input w3-border w3-light-grey" name="type" required>
                <option selected="true" disabled="disabled" hidden></option>
                <option value="Trabalho">Trabalho</option>
                <option value="Estudos">Estudos</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Saúde">Saúde</option>
                <option value="Lazer">Lazer</option>
                <option value="Outro">Outro</option>
            </select>

            <div id="buttons" style="margin-top: 20px">
                <input class="w3-btn w3-blue-grey" type="submit" value="Registar"/>
                <input class="w3-btn w3-blue-grey" type="reset" value="Limpar valores"/>
            </div>
        </form>
    `;
}

function toDoList(tasks) {
    let html = `
        <div class="w3-container w3-teal">
                <h2 style="float: left;">Tarefas por fazer</h2>
                <form action="/tasks" method="GET">
                    <select class="w3-btn w3-white" name="filter" onChange="this.form.submit()" style="float: right; margin-top: 17px;">
                        <option selected disabled="disabled" hidden>Filtrar por tipo</option>
                        <option value="Todos">Todos</option>
                        <option value="Trabalho">Trabalho</option>
                        <option value="Estudos">Estudos</option>
                        <option value="Limpeza">Limpeza</option>
                        <option value="Saúde">Saúde</option>
                        <option value="Lazer">Lazer</option>
                        <option value="Outro">Outro</option>
                    </select>
                </form>
            </div>
        <table class="w3-table w3-bordered">
            <tr>
                <th>Descrição</th>
                <th>Responsável</th>
                <th>Data de criação</th>
                <th>Prazo</th>
                <th>Tipo</th>
                <th style="text-align: center">Concluir</th>
            </tr>
    `;

    tasks.forEach(t => {
        html += `
            <tr>
                <td style="word-wrap: break-word; max-width: 250px;">${t.description}</td>
                <td style="word-wrap: break-word; max-width: 200px;">${t.who}</td>
                <td>${t.created}</td>
                <td><input value="${t.due}" disabled/></td>
                <td><input value="${t.type}" disabled/></td>
                <td style="text-align: center">
                    <form action="/tasks/finish/${t.id}" method="POST">
                        <input name="description" value="${t.description}" hidden>
                        <input name="created" value="${t.created}" hidden>
                        <input name="due" value="${t.due}" hidden>
                        <input name="who" value="${t.who}" hidden>
                        <input name="type" value="${t.type}" hidden>
                        <input type="checkbox" onChange="this.form.submit()">
                    </form>
                </td>
            </tr>
        `;
    })

    html += `</table>`;
    return html;
}

function doneList(tasks) {
    let html = `
        <div class="w3-container w3-teal">
            <h2>Tarefas feitas</h2>
        </div>
        <table class="w3-table w3-bordered">
            <tr>
                <th>Descrição</th>
                <th>Responsável</th>
                <th>Data de criação</th>
                <th>Prazo</th>
                <th>Tipo</th>
                <th style="text-align: center">Eliminar</th>
            </tr>
    `;

    tasks.forEach(t => {
        html += `
            <tr>
                <td style="word-wrap: break-word; max-width: 250px;">${t.description}</td>
                <td style="word-wrap: break-word; max-width: 200px;">${t.who}</td>
                <td>${t.created}</td>
                <td>${t.due}</td>
                <td>${t.type}</td>
                <td style="text-align: center">
                    <form action="/tasks/delete/${t.id}" method="POST">
                        <input type="checkbox" onChange="this.form.submit()">
                    </form>
                </td>
            </tr>
        `;
    })

    html += `</table>`;
    return html;
}

function pageFooter(d) {
    return `
        <div class="w3-container w3-teal">
                <address>Da autoria de Hugo Cardoso (A85006)::DAW2020 / Página atualizada em ${d}</address>
            </div>
        </body>
        </html>
    `;
}

function getTasks(d, filter, res) {
    let query = filter != 'Todos' ? `http://localhost:3001/tasks?type=${filter}&` : 'http://localhost:3001/tasks?';

    axios.all([axios.get(`${query}done=false`),
               axios.get(`http://localhost:3001/tasks?done=true`)])
        .then(axios.spread((toDo, done) => {  
            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});

            res.write(pageHead());
            res.write(taskForm());
            res.write(toDoList(toDo.data));
            res.write(doneList(done.data));
            res.write(pageFooter(d));

            res.end();
        }))
        .catch(error => {
            console.log("Erro no GET das tarefas: " + error)
            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'})
            res.write("<p>Ocorreu um erro na obtenção das tarefas.")
            res.end()
        })


}

var server = http.createServer(function (req, res) {
    // Logger: que pedido chegou e quando
    var d = new Date().toISOString().substr(0, 16)
    console.log(req.method + " " + req.url + " " + d)
    
    // Request processing
    // Tests if a static resource is requested
    if (static.staticResource(req)) {
        static.serveStaticResource(req, res);
    }
    else {
        switch (req.method) {
            case 'GET':
                if (req.url == '/' || req.url == '/tasks') getTasks(d, 'Todos', res);
                else if (/^\/tasks\?filter=\S+$/) {
                    let filter = req.url.split('=')[1];
                    getTasks(d, filter, res);
                }
                else badRequest(req, res);
                break;
            case 'POST':
                if (req.url == '/tasks') {
                    //obter a informação da nova tarefa do form
                    getFormData(req, newTask => {
                        console.log('POST de tarefa: ' + JSON.stringify(newTask));
                        
                        //ir buscar o id da nova tarefa
                        axios.get('http://localhost:3001/relevantIds/1')
                            .then(resp => {
                                let idObject = resp.data;

                                //introduzir os campos que faltam da nova tarefa
                                newTask["id"] = idObject.value;
                                newTask["created"] = getCurrentDate();
                                newTask["due"] = formatDueDate(newTask["due"]);
                                newTask["done"] = false;
                                
                                //incrementar o valor do id da próxima tarefa
                                idObject["value"] = (parseInt(idObject.value)+1).toString();

                                //introduzir a nova tarefa no ficheiro json
                                axios.post('http://localhost:3001/tasks', newTask)
                                    .then(resp => {
                                        //incrementar o id da próxima tarefa no ficheiro json
                                        axios.put('http://localhost:3001/relevantIds/1', idObject)
                                            .then(resp => {
                                                //dar reload à página para mostrar a nova tarefa
                                                getTasks(d, 'Todos', res);
                                            })
                                            .catch(error => {
                                                logError('Erro na incrementação do id da próxima tarefa', 'PUT', error, res);
                                            })
                                    })
                                    .catch(error => {
                                        logError('Erro na introdução da nova tarefa', 'POST', error, res);
                                    })
                            }).catch(error => {
                                logError('Erro na obtenção do id da tarefa', 'GET', error, res);
                            })
                            
                        
                    })
                }
                else if (/^\/tasks\/finish\/[1-9][0-9]*$/.test(req.url)) {
                    let id = req.url.split('/')[3];

                    //obter a informação da tarefa concluída
                    getFormData(req, finishedTask => {
                        console.log('POST de concluir tarefa: ' + JSON.stringify(finishedTask));

                        finishedTask["done"] = true;
                        
                        axios.put('http://localhost:3001/tasks/'+id, finishedTask)
                            .then(resp => {
                                //dar reload à página para mostrar a tarefa resolvida
                                getTasks(d, 'Todos', res);
                            })
                            .catch(error => {
                                logError('Erro ao concluir a tarefa', 'PUT', error, res)
                            })
                    })
                }
                else if (/^\/tasks\/delete\/[1-9][0-9]*$/.test(req.url)) {
                    let id = req.url.split('/')[3];
                    
                    axios.delete('http://localhost:3001/tasks/'+id)
                        .then(resp => {
                            //dar reload à página para mostrar a tarefa resolvida
                            getTasks(d, 'Todos', res);
                        })
                        .catch(error => {
                            logError('Erro ao eliminar a tarefa', 'DELETE', error, res)
                        })
                }
                else badRequest(req, res);
                break;
        }
    }
})

server.listen(7778);
console.log('Servidor à escuta na porta 7778...');