// Cria uma instancia do socket.io  para comunicação via websocket
const socket = io();

// Variaveis para armazenar o nome de usuario e a lista de usuarios conectados
let userName = '';
let userList = [];

// Seleciona elementos HTML relevantes pelo ID
let loginPage = document.querySelector('#loginPage');
let chatPage = document.querySelector('#chatPage');
let loginInput = document.querySelector('#loginNameInput');
let textInput = document.querySelector('#chatTextInput');

// Define a exibição inivial das paginas
loginPage.style.display = 'flex';
chatPage.style.display = 'none';

// Função para renderizar a lista de usuarios na interface
function renderUserList() {
    let ul = document.querySelector('.userList');
    ul.innerHTML = '';

    // Percorre a lista de usuarios e adiciona cada um como um item de lista HTML
    userList.forEach(i => {
        ul.innerHTML += '<li>' + i + '</li>';
    });
}

// Função para adicionar uma mensagem a janela de chat
function addMessage(type, user, msg) {
    let ul = document.querySelector('.chatList');

    // Com base no tipo de mensagem (status ou mensagem de usuario), cria elementos de list HTML
    switch (type) {
        case 'status':
            ul.innerHTML += '<li class= "m-status">' + msg + '</li>';
            break;
    
        case 'msg':
            if (username == user) {
                ul.innerHTML += '<li class= "m-txt"><span class="me">' + user + '</span>' + msg + '</li>';
            } else {
                ul.innerHTML += '<li class= "m-txt"><span>' + user + '</span>' + msg + '</li>';
            }
            break;
    }

    // Rola a janela de chat para a ultima mensagem
    ul.scrollTop = ul.scrollHeight;
}

// Event listener para o campo de entrada de nome de usuario no formulario de login
loginInput.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        let name = loginInput.value.trim();
        if (name != '') {
            username = name;
            document.title = 'Chat (' + username + ')';

            // Envia uma solicitação para ingressar no chat com o nome de usuario escolhido
            socket.emit('join-request', username);
        }
    }
});

// Event listener para o campo de entrada de texto na janela de chat
textInput.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        let txt = textInput.value.trim();
        textInput.value = '';

        if (txt != '') {
            // Adiciona a mensagem à janela de chat e envia por websocket
            addMessage('msg', username, txt);
            socket.emit('send-msg', txt);
        }
    }
});

// Eventos socket.io para lidar com mensagens do servidor

// Quando o servidor confirma que o usuario se conectou com sucesso
socket.on('user-ok', (list) => {
    loginPage.style.display = 'none';
    chatPage.style.display = 'flex';
    textInput.focus();

    // Adiciona uma mensagem de status à janela de chat
    addMessage('status', null, 'Conectado!');

    // Atualiza a lista de ususários e exibe na interface
    userList = list;
    renderUserList();
});

// Quando o servidor envia uma atualização da lista de usuários
socket.on('list-update', (data) => {
    if(data.joined){
        addMessage('status', null, data.joined + ' entrou no chat.');
    }
    if (data.left){
        addMessage('status', null, data.left + ' saiu do chat.');
    }

    // Atualiza a lista de usuários e exibe na interface
    userList = data.list;
    renderUserList();
});

// Quando o servidor envia uma mensagem de chat
socket.on('show-msg', (data) => {
    // Adiciona a mensagem à janela de chat
    addMessage('msg', data.username, data.message);
});

// Quando a conexão com o servidor é encerrada
socket.on('disconnect', () => {
    addMessage('status', null, 'Você foi desconectado!');
    userList = [];
    renderUserList();
});

// Quando ocorre um erro de reconexão com o servidor
socket.on('reconnect_error', () => {
    addMessage('status', null, 'Tentando reconectar...');
});

// Quando a reconexão com o servidor é bem sucedida
socket.on('reconnect', () => {
    addMessage('status', null, 'Reconectado!');

    if (username != '') {
        // Se um nome de usuário estiver definido, envia uma solicitação de ingresso novamente
        socket.emit('join-request', username);
    }
});