// const socket = new WebSocket(`ws://${window.location.host}`);

// const messageList = document.querySelector("ul");
// const nickForm = document.querySelector("#nick");
// const messageForm = document.querySelector("#message");

// function makeMessage(type, payload) {
//     const msg = { type, payload };
//     return JSON.stringify(msg);
// }

// socket.addEventListener("open", ()=>{
//     console.log("Conneted to Server");
// })

// socket.addEventListener("message", (message) => {
//     // console.log("Just got this: ", message.data, " from the server");
//     const li = document.createElement("li");
//     li.innerText = message.data;
//     messageList.append(li);
// })

// socket.addEventListener("close", () => {
//     console.log("Disconnected from server");
// })

// // setTimeout(() => {
// //     socket.send("hello from the browser!");
// // }, 50000);

// messageForm.addEventListener("submit", (event) => {
//     event.preventDefault();
//     const message = messageForm.querySelector("input");
//     socket.send(makeMessage("message", message.value));
//     message.value = "";
// });

// nickForm.addEventListener("submit", (event) => {
//     event.preventDefault();
//     const nickName = nickForm.querySelector("input");
//     socket.send(makeMessage("nickName", nickName.value));
//     nickName.value = "";
// });

const socket = io();

const welcome = document.getElementById("welcome");
const roomForm = welcome.querySelector("form");
const room = document.getElementById('room');
const h3 = room.querySelector("h3");
const ul = room.querySelector("ul");
const chatForm = room.querySelector("form");
const roomList = welcome.querySelector("ul");

room.hidden = true;

let roomName;
let nickname;

function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    h3.innerText = `Room ${roomName}`;
}

function addMessage(message) {
    let li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

roomForm.addEventListener("submit", (event) => {
    event.preventDefault();
    roomName = roomForm.querySelector("#roomName").value;
    nickname = roomForm.querySelector("#nickname").value;
    socket.emit("room", roomName, nickname, showRoom); // 임의 event 생성 가능, object 전송 가능(여러가지도 보낼 수 있음), 서버에 넘길 function (back-end에서 실행되는것x)
    roomForm.querySelector("#roomName").value = "";
    roomForm.querySelector("#nickname").value = "";
});

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = chatForm.querySelector("input");
    const value = input.value;
    socket.emit("sendMessage", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
})

socket.on("welcome", (nickName, roomCount) => {
    addMessage(`${nickName} joined!`);
    h3.innerText = `Room ${roomName} (${roomCount})`;
});

socket.on("bye", (nickname, roomCount) => {
    addMessage(`${nickname} left!`);
    h3.innerText = `Room ${roomName} (${roomCount})`;
});

socket.on("sendMessage", (nickName, msg) => {
    addMessage(`${nickName}: ${msg}`);
})

socket.on("room_change", (rooms) => {
    roomList.innerHTML = "";
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    })
})