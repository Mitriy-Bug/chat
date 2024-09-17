export default class Chat {
    constructor(container) {
        this.container = container;
        this.websocket = new WebSocket("wss://server-chat-nxif.onrender.com");
        this.rest = 'https://server-chat-nxif.onrender.com/new-user';
        this.userList = [];
    }
    init() {
        this.chatName = window.localStorage.getItem('chatname');
        if(!this.chatName){
            this.createName();
        }
        else {
            this.bindToDOM();
            this.chatUserlist = document.querySelector(".chat__users");
            this.form = this.container.querySelector(".form");

            if(this.userList.indexOf(this.chatName) === -1) {
                this.userList.push(this.chatName);
            }
            //this.registerUser(this.chatName);
            //this.updateUserlist(this.chatName);
            //this.userListFromStorage(this.chatName);
            this.sendMessage(this.chatName);
            this.closingPage(this.chatName);
        }
    }
    createName() {
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
                    }).then((response) => {
                        if(response.status === 409) {
                            errorBlock.innerHTML = 'Такой пользователь уже существует. Введите другой псевдоним';
                            return false; //если пользователь уже существует
                        } else if(response.status === 200) {
                            errorBlock.innerHTML = '';
                            this.container.innerHTML = '';
                            window.localStorage.setItem('chatname', formName);
                            this.bindToDOM();
                            this.chatUserlist = document.querySelector(".chat__users");

                            if(this.userList.indexOf(formName) === -1) {
                                this.userList.push(formName);
                            }
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
    }

    registerUser(name) {
        //console.log(name);
        this.websocket.send(JSON.stringify({
            name: name,
            type: 'send',
            option: 'register'
        }))
        if(this.userList.indexOf(name) === -1) {
            this.userList.push(name);
        }
    }

    updateUserlist(users) {
            if(users){
                if(this.chatUserlist){
                  //this.chatUserlist.replaceChildren();
                        users.forEach(user => {
                            if (user.name) {
                                let newUser = document.createElement("div");
                                newUser.classList.add("chat__user");
                                newUser.innerHTML = user.name;
                                this.chatUserlist.insertAdjacentElement('beforeEnd', newUser);

                                if(this.userList.indexOf(user.name) === -1) {
                                    this.userList.push(user.name);
                                }

                            }
                        })
                }
            }
    }
    sendMessage(name) {
        if (this.form) {
            //console.log(this.form);
            this.form.addEventListener("submit", (e) => {
                e.preventDefault();
                let message = document.querySelector(".message__input");
                if (!message.value) {
                    return false;
                }

                this.websocket.send(JSON.stringify({
                    name,
                    type: 'send',
                    option: 'message',
                    message: message.value
                }))
                message.value = '';
            })
        }
        this.websocket.addEventListener("message", (e) => {

            let data = JSON.parse(e.data)
            //console.log(this.userList);
            //console.log(data);
            console.log(data.name);
            //this.updateUserlist([{name:data.name}])
            if(this.userList.indexOf(data.name) === -1) {
                //this.userList.push(data.name);
                this.updateUserlist([{name:data.name}])
            }
            if (data.type === undefined) {
                console.log(data);
               //this.updateUserlist(data);
                //this.chatUserlist = document.querySelector(".chat__users");
                //        if (this.chatUserlist) {
                //            //this.chatUserlist.replaceChildren();
                //             //this.userList.push(name);
                //            console.log([{name:data.name}]);
                //            this.updateUserlist([{name:data.name}])
                //         }
            }

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

                if(this.userList.indexOf(data.name) === -1) {
                    this.userList.push(data.name);
                }
            }
            if (data.option === 'register') {
                console.log(data);

                if(this.userList.indexOf(data.name) === -1) {
                    this.userList.push(data.name);
                }

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
            //window.localStorage.clear();
            // if(this.chatUserlist){
            //     this.chatUserlist.forEach(user => {
            //
            //     })
            // }
            //this.updateUserlist(name);
        });
    }
}