export default class Chat {
    constructor(container) {
        this.container = container;
        this.websocket = new WebSocket("ws://localhost:3000/ws");
        this.rest = 'http://localhost:3000/new-user';
        this.userList = [];
    }

    init() {

        this.chatName = window.localStorage.getItem('chatname');
        if(!this.chatName){
            this.createName();
        }
        else {
            this.userListFromStorage(this.chatName);
            this.bindToDOM();
            this.updateUserlist(this.chatName);
            this.sendMessage(this.chatName);
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
                    if(response.status == 409) {
                        errorBlock.innerHTML = 'Такой пользователь уже существует. Введите другой псевдоним';
                        return false; //если пользователь уже существует
                    } else if(response.status == 200) {
                        errorBlock.innerHTML = '';
                        this.container.innerHTML = '';
                        window.localStorage.setItem('chatname', formName);
                        this.registerUser(formName);
                        this.bindToDOM();
                        this.updateUserlist(formName);
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
        this.websocket.send(JSON.stringify({
            name,
            type: 'send',
            option: 'register'
        }))
    }
    userListFromStorage(name) {
        this.websocket.addEventListener("open", (e) => {
            let chatUserList = document.querySelector(".chat__users");
            if (chatUserList) {
                //chatUserList.replaceChildren();
                this.userList.push(name);

            }
            this.updateUserlist(name)
        })
    }
    updateUserlist(name) {
        this.websocket.addEventListener("message", (e) => {
            let data = JSON.parse(e.data)
            let chatUserlist = document.querySelector(".chat__users");
console.log(data.option);
            if (data.option === undefined){
                if (chatUserlist) {
                    chatUserlist.replaceChildren();
                    let nameUser = name;
                    data.forEach(user => {
                        // if (user.name === name) {
                        //     nameUser = 'YOU';
                        // }
                        let newUser = document.createElement("div");
                        newUser.classList.add("chat__user");
                        newUser.innerHTML = user.name;
                        chatUserlist.insertAdjacentElement('beforeEnd', newUser);
                    })
                }
            }
                if (data.option === 'register') {
                    this.userList.push(data.name);
                    if (chatUserlist) {
                        chatUserlist.replaceChildren();
                        this.userList.forEach(user => {
                            let newUser = document.createElement("div");
                            newUser.classList.add("chat__user");
                            newUser.innerHTML = user;
                            chatUserlist.insertAdjacentElement('beforeEnd', newUser);
                        })
                    }
                }
                //if (data.option === 'message') {
                    // let yourMessage = 'message__container-interlocutor';
                    // let yourName = data.name;
                    // if (data.name === name){
                    //     yourMessage = 'message__container-yourself';
                    //     yourName = 'YOU';
                    // }
                    // const chatMessagesContainer = document.querySelector(".chat__messages-container");
                    //
                    // if (chatMessagesContainer) {
                    //     chatMessagesContainer.insertAdjacentHTML(
                    //         'beforeEnd',
                    //         `
                    //             <div class="message__container ${yourMessage}">
                    //                     <div class="message__header">${yourName}</div>
                    //                     <div class="">${data.message}</div>
                    //                 </div>
                    //             `
                    //     );
                    // }
               // }
        })
    }
    sendMessage(name) {
        let form = this.container.querySelector(".form");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                let message = document.querySelector(".message__input");
                if (!message.value) {
                    return false;
                }
                console.log(message);
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
            console.log(data.option);
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
        }
    })
    }

}