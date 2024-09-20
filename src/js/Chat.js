export default class Chat {
    constructor(container) {
        this.container = container;
        this.websocket = new WebSocket("wss://server-chat-nxif.onrender.com");
        this.rest = 'https://server-chat-nxif.onrender.com/new-user';
        this.userList = [];
    }
    init() {
        this.createName();
    }
    createForm() {
        this.container.insertAdjacentHTML("afterbegin", `
            <div class="modal__form active">
                <div class="modal__background">
                    <div class="modal__content modal-text">
                        <div class="modal__header">Выберите псевдоним</div>
                        <div class="modal__body">
                        <div class="form__group">
                            <input type="text" class="form__name form__input" placeholder="Введите ваш псевдоним">
                            <span class="form__hint"></span>
                            <button class="btn btn-psevdoname">Отправить</button>
                        </div>
                        </div>
                   </div>
                    </div>
            </div>
            `);
    }
    createName() {
            this.createForm();
            const btnPsevdoname = document.querySelector(".btn-psevdoname");
            const errorBlock = document.querySelector(".form__hint");

            if (btnPsevdoname) {
                btnPsevdoname.addEventListener("click", (e) => {
                    const formName = document.querySelector(".form__name").value;
                    if (!formName) {
                        errorBlock.innerHTML = "Пустой псевдоним недопустим";
                        return;
                    } //проверка на пустоту
                    let data = JSON.stringify({name: formName})
                    fetch(this.rest, {
                        method: 'post',
                        body: data
                    })
                        .then((response) => {
                            if (response.status === 409) {
                                errorBlock.innerHTML = 'Такой пользователь уже существует. Введите другой псевдоним';
                                return false; //если пользователь уже существует
                            } else if (response.status === 200) {
                                this.logged = true;
                                errorBlock.innerHTML = '';
                                this.container.innerHTML = '';

                                this.bindToDOM();
                                this.sendForm(formName)
                                this.chatUserlist = document.querySelector(".chat__users");

                                // if (this.userList.indexOf(formName) === -1) {
                                //     this.userList.push(formName);
                                // }
                                this.registerUser(formName);
                                this.sendMessage(formName);
                                this.closingPage(formName);
                            }
                        })
                })
            }
    }
    bindToDOM() {
        this.container.insertAdjacentHTML("afterbegin", `
            <div class="container">
               <div class="chat__container">
               
                <div class="chat__userlist">
                    <div class="chat__header">Пользователи On-line</div>
                    <div class="chat__users"></div>
                </div>
                <div class="chat__area">
                    <div class="chat__messages-container">
                    <div class="chat__header">Чат</div>
                    </div>
                    <div class="chat__messages-input">
                        <form class="form">
                            <div class="form__group">
                                <input type="text" class="form__input message__input" placeholder="Введите сообщение">
                                <button class="btn btn-send-message" type="submit">Отправить</button>
                            </div>
                        </form>
                    </div>    
                </div>
               </div>
            </div>
        `);
        this.form = this.container.querySelector(".form");
    }

    registerUser(name) {
        //console.log(name);
        if(this.websocket.readyState === 1) {
            this.websocket.send(JSON.stringify({
                name: name,
                type: 'send',
                option: 'register'
            }))
        } else {
            console.log('Соединение не установлено');
        }
        if(this.userList.indexOf(name) === -1) {
            this.userList.push(name);
        }
    }
    updateUserlist(users) {
        // console.log(this.userList);
        // console.log(users);
            if(users){
                if(this.chatUserlist){
                        users.forEach(user => {
                            if (user.name) {
                                if(this.userList.indexOf(user.name) === -1) {
                                    this.userList.push(user.name);
                                    let newUser = document.createElement("div");
                                    newUser.classList.add("chat__user");
                                    newUser.innerHTML = user.name;
                                    this.chatUserlist.insertAdjacentElement('beforeEnd', newUser);
                                }
                            }
                        })
                }
            }
    }
    sendForm(name) {
            let message = document.querySelector(".message__input");
            this.form.addEventListener("submit", (e) => {
                e.preventDefault();
                if (!message.value) {
                    return false;
                }
                if(this.websocket.readyState === 1) {
                    this.websocket.send(JSON.stringify({
                        name,
                        type: 'send',
                        option: 'message',
                        message: message.value
                    }))
                    message.value = '';
                } else {
                    console.log('Соединение не установлено');
                }
            })
    }
    sendMessage(name) {
        this.websocket.addEventListener("message", (e) => {

            let data = JSON.parse(e.data)

            if (data.option === 'message') {
                let yourMessage = 'message__container-interlocutor';
                let yourName = data.name;
                if (data.name === name) {
                    yourMessage = 'message__container-yourself';
                    yourName = 'YOU';
                }
                const chatMessagesContainer = document.querySelector(".chat__messages-container");

                if (chatMessagesContainer) {
                    chatMessagesContainer.insertAdjacentHTML(
                        'beforeEnd',
                        `
                             <div class="message__container ${yourMessage}">
                               <div class="message__header">${yourName}</div>
                               <div class="">${data.message}</div>
                             </div>
                             `
                    );
                }
                this.updateUserlist([{name:data.name}])

            }
            if (data.option === 'register') {
                if (data.name) {
                    let newUser = document.createElement("div");
                    newUser.classList.add("chat__user");
                    newUser.innerHTML = data.name;
                    this.chatUserlist.insertAdjacentElement('beforeEnd', newUser);
                }
            }
     })
    }
    closingPage(name) {
        window.addEventListener("unload", (e) => {
                this.websocket.send(
                    JSON.stringify({
                        type: 'exit',
                        user: name
                    })
                );
        });
    }
}