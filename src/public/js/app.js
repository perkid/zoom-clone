const socket = new WebSocket(`ws://${window.location.host}`);

const messageList = document.querySelector("ul");
const nickForm = document.querySelector("#nick");
const messageForm = document.querySelector("#message");

function makeMessage(type, payload) {
    const msg = { type, payload };
    return JSON.stringify(msg);
}

socket.addEventListener("open", ()=>{
    console.log("Conneted to Server");
})

socket.addEventListener("message", (message) => {
    // console.log("Just got this: ", message.data, " from the server");
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
})

socket.addEventListener("close", () => {
    console.log("Disconnected from server");
})

// setTimeout(() => {
//     socket.send("hello from the browser!");
// }, 50000);

messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = messageForm.querySelector("input");
    socket.send(makeMessage("message", message.value));
    message.value = "";
});

nickForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const nickName = nickForm.querySelector("input");
    socket.send(makeMessage("nickName", nickName.value));
    nickName.value = "";
});