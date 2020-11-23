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
    console.log("Erro no ${method}: " + error)

    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
    res.write(`<p>${msg}</p>`);
    res.end();
}

//obter a data atual em formato datetime-local
function getCurrentDate() {
    var today = new Date();

    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    var hh = String(today.getHours()).padStart(2, '0');
    var MM = String(today.getMinutes()).padStart(2, '0');

    return yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + MM;
}

//formatar uma data de maneira mais legível
function formatDate(date) {
    var datetime = date.split('T');
    var ymd = datetime[0].split('-');
    var hM = datetime[1].split(':');

    return ymd[2] + '-' + ymd[1] + '-' + ymd[0] + ', ' + hM[0] + ':' + hM[1];
}

//recupera informação enviada num form
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

//código HTML para a cabeça da página
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

//código HTML para o form de criar tarefa
function createTaskForm() {
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

//código HTML para o form de editar tarefa
function editTaskForm(task) {
    console.log(task)
    return `
        <div class="w3-container w3-green">
            <h2>Editar tarefa</h2>
        </div>
          
        <form class="w3-container" method="POST" style="margin-top: 15px">
            <input name="created" value="${task.created}" hidden>
            <input name="done" value="${task.done}" hidden>
            
            <label class="w3-text-teal"><b>Descrição:</b></label>
            <input class="w3-input w3-border w3-light-grey" type="text" name="description" value="${task.description}" style="margin-bottom: 10px" required>
          
            <label class="w3-text-teal"><b>Responsável:</b></label>
            <input class="w3-input w3-border w3-light-grey" type="text" name="who" value="${task.who}" style="margin-bottom: 10px" required>

            <label class="w3-text-teal"><b>Prazo:</b></label>
            <input class="w3-input w3-border w3-light-grey" type="datetime-local" name="due" value="${task.due}" style="margin-bottom: 10px" required>

            <label class="w3-text-teal"><b>Tipo de tarefa:</b></label>
            <select class="w3-input w3-border w3-light-grey" name="type" required>
                <option selected="true" value="${task.type}" hidden>${task.type}</option>
                <option value="Trabalho">Trabalho</option>
                <option value="Estudos">Estudos</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Saúde">Saúde</option>
                <option value="Lazer">Lazer</option>
                <option value="Outro">Outro</option>
            </select>

            <div id="buttons" style="margin-top: 20px">
                <input class="w3-btn w3-blue-grey" type="submit" formaction="/tasks/edited/${task.id}" value="Submeter"/>
                <input class="w3-btn w3-blue-grey" type="submit" formaction="/tasks/delete/${task.id}" value="Eliminar tarefa"/>
            </div>
        </form>
    `;
}

//código HTML para a lista de tarefas por fazer
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
                <th style="text-align: center"></th>
                <th style="text-align: center">Concluir</th>
            </tr>
    `;

    tasks.forEach(t => {
        html += `
            <tr>
                <td style="word-wrap: break-word; max-width: 350;">${t.description}</td>
                <td style="word-wrap: break-word; max-width: 200px;">${t.who}</td>
                <td>${formatDate(t.created)}</td>
                <td>${formatDate(t.due)}</td>
                <td>${t.type}</td>
                <td style="text-align: center">
                    <form action="/tasks/edit/${t.id}" method="POST">
                        <button type="submit">✏️</button>
                    </form>
                </td>
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

//código HTML para a lista de tarefas feitas
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
                <td>${formatDate(t.created)}</td>
                <td>${formatDate(t.due)}</td>
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

//código HTML para o rodapé da página
function pageFooter(d) {
    return `
        <div class="w3-container w3-teal">
                <address>Da autoria de Hugo Cardoso (A85006)::DAW2020 / Página atualizada em ${d}</address>
            </div>
        </body>
        </html>
    `;
}

//ir buscar as tarefas em questão à bd e dar render à página HMTL com essa informação
function renderPage(datetime, formOp, editingTask, filter, res) {
    let query = filter != 'Todos' ? `http://localhost:3000/tasks?type=${filter}&` : 'http://localhost:3000/tasks?';

    axios.all([axios.get(`${query}done=false`),
               axios.get(`http://localhost:3000/tasks?done=true`)])
        .then(axios.spread((toDo, done) => {  
            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});

            res.write(pageHead());
            if (formOp == 'create') res.write(createTaskForm());
            else {
                //não mostrar a tarefa que está a ser editada na lista
                let t = toDo.data.filter(obj => { return obj.id == editingTask.id; });
                toDo.data.splice(toDo.data.indexOf(t[0]),1);

                res.write(editTaskForm(editingTask));
            }
            res.write(toDoList(toDo.data));
            res.write(doneList(done.data));
            res.write(pageFooter(datetime));

            res.end();
        }))
        .catch(error => {
            logError('Erro na obtenção das tarefas.', 'GET', error, res);
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
                if (req.url == '/' || req.url == '/tasks') renderPage(d, 'create', null, 'Todos', res);
                else if (/^\/tasks\?filter=\S+$/) {
                    let filter = req.url.split('=')[1];
                    renderPage(d, 'create', null, filter, res);
                }
                else badRequest(req, res);
                break;
            case 'POST':
                if (req.url == '/tasks') {
                    //obter a informação da nova tarefa do form
                    getFormData(req, newTask => {
                        console.log('POST de tarefa: ' + JSON.stringify(newTask));
                        
                        //ir buscar o id da nova tarefa
                        axios.get('http://localhost:3000/relevantIds/1')
                            .then(resp => {
                                let idObject = resp.data;

                                //introduzir os campos que faltam da nova tarefa
                                newTask["id"] = idObject.value;
                                newTask["created"] = getCurrentDate();
                                newTask["done"] = false;
                                
                                //incrementar o valor do id da próxima tarefa
                                idObject["value"] = (parseInt(idObject.value)+1).toString();

                                //introduzir a nova tarefa no ficheiro json
                                axios.post('http://localhost:3000/tasks', newTask)
                                    .then(resp => {
                                        //incrementar o id da próxima tarefa no ficheiro json
                                        axios.put('http://localhost:3000/relevantIds/1', idObject)
                                            .then(resp => {
                                                //dar reload à página para mostrar a nova tarefa
                                                renderPage(d, 'create', null, 'Todos', res);
                                            })
                                            .catch(error => {
                                                logError('Erro na incrementação do id da próxima tarefa.', 'PUT', error, res);
                                            })
                                    })
                                    .catch(error => {
                                        logError('Erro na introdução da nova tarefa.', 'POST', error, res);
                                    })
                            }).catch(error => {
                                logError('Erro na obtenção do id da tarefa.', 'GET', error, res);
                            })
                            
                        
                    })
                }
                /* nesta operação podia ter guardado os outros parâmetros da tarefa em questão escondidos no form de edição,
                tal como fiz no finish-task, e receber logo a info toda aqui, assim não precisava de fazer o get ao json-server */
                else if (/^\/tasks\/edit\/[1-9][0-9]*$/.test(req.url)) {
                    let id = req.url.split('/')[3];
                    
                    axios.get('http://localhost:3000/tasks/'+id)
                        .then(resp => {
                            //dar reload à página para mostrar o form de edição
                            //e ocultar a tarefa da respetiva lista temporariamente
                            renderPage(d, 'edit', resp.data, 'Todos', res);
                        })
                        .catch(error => {
                            logError('Erro ao selecionar a tarefa para edição.', 'GET', error, res);
                        })
                }
                else if (/^\/tasks\/edited\/[1-9][0-9]*$/.test(req.url)) {
                    let id = req.url.split('/')[3];
                    
                    //obter a informação da tarefa editada
                    getFormData(req, editedTask => {
                        //manter o campo 'done' como um boleano na bd
                        editedTask["done"] = editedTask["done"] == 'false' ? false : true;

                        axios.put('http://localhost:3000/tasks/'+id, editedTask)
                            .then(resp => {
                                //dar reload à página para mostrar a tarefa editada na respetiva lista
                                renderPage(d, 'create', null, 'Todos', res);
                            })
                            .catch(error => {
                                logError('Erro ao editar a tarefa.', 'PUT', error, res);
                            })
                    })
                }
                else if (/^\/tasks\/finish\/[1-9][0-9]*$/.test(req.url)) {
                    let id = req.url.split('/')[3];

                    //obter a informação da tarefa concluída
                    getFormData(req, finishedTask => {
                        console.log('POST de concluir tarefa: ' + JSON.stringify(finishedTask));

                        finishedTask["done"] = true;
                        
                        axios.put('http://localhost:3000/tasks/'+id, finishedTask)
                            .then(resp => {
                                //dar reload à página para mostrar a tarefa resolvida
                                renderPage(d, 'create', null, 'Todos', res);
                            })
                            .catch(error => {
                                logError('Erro ao concluir a tarefa.', 'PUT', error, res);
                            })
                    })
                }
                else if (/^\/tasks\/delete\/[1-9][0-9]*$/.test(req.url)) {
                    let id = req.url.split('/')[3];
                    
                    axios.delete('http://localhost:3000/tasks/'+id)
                        .then(resp => {
                            //dar reload à página para parar de mostrar a tarefa apagada
                            renderPage(d, 'create', null, 'Todos', res);
                        })
                        .catch(error => {
                            logError('Erro ao eliminar a tarefa.', 'DELETE', error, res);
                        })
                }
                else badRequest(req, res);
                break;
            default:
                badRequest(req, res);
                break;
        }
    }
})

server.listen(7777);
console.log('Servidor à escuta na porta 7777...');