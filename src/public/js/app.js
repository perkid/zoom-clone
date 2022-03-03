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
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const peerFace = document.getElementById("peerFace");

let myStream;
let muted = false;
let cameraOff = false;
let myPeerConnection;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices(); // 유저의 모든 디바이스를 가져옴
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];

        cameras.forEach(camera=> {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label == camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        })
    } catch (e) {
        console.log(e);
    }
}
async function getMedia(deviceId) {
    const initalConstrains = {
        audio: true,
        video: { facingMode: "user"}
    }
    const cameraConstraints = {
        audio: true,
        video: { deviceId: { exact: deviceId }}
    }

    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initalConstrains
        );
        myFace.srcObject = myStream;
        if(!deviceId){
            await getCameras();
        }
    } catch (e) {
        console.log(e);
    }
}

function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
              urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
              ],
            },
          ],
    });
    myPeerConnection.addEventListener("icecandidate", (data) => {
        socket.emit("ice", data.candidate, roomName);
    });
    myPeerConnection.addEventListener("addstream", (data) => {
        peerFace.srcObject = data.stream;
    });
    myPeerConnection.addEventListener("track", (data) => {
        peerFace.srcObject = data.streams[0];
    });
    myStream.getTracks().forEach((track) => {
        myPeerConnection.addTrack(track, myStream);
    });
};

// welcome.hidden = true;
room.hidden = true;
// getMedia();

let roomName;
let nickname;

async function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    h3.innerText = `Room ${roomName}`;
    await getMedia();
    makeConnection();
}

function addMessage(message) {
    let li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

roomForm.addEventListener("submit", async(event) => {
    event.preventDefault();
    roomName = roomForm.querySelector("#roomName").value;
    nickname = roomForm.querySelector("#nickname").value;
    await showRoom();
    socket.emit("room", roomName, nickname); // 임의 event 생성 가능, object 전송 가능(여러가지도 보낼 수 있음), 서버에 넘길 function (back-end에서 실행되는것x)
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
});

muteBtn.addEventListener("click", () => {
    if(!muted) {
        myStream.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        myStream.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        muteBtn.innerText = "Mute";
        muted = false;
    }
});

cameraBtn.addEventListener("click", () => {
    if(!cameraOff) {
        myStream.getVideoTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        cameraBtn.innerText = "Turn Camera on";
        cameraOff = true;
    } else {
        myStream.getVideoTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        cameraBtn.innerText = "Turn Camera off";
        cameraOff = false;
    }
});

camerasSelect.addEventListener("input", async() =>{
    await getMedia(camerasSelect.value);
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
});

socket.on("welcome", async (nickName, roomCount) => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
    addMessage(`${nickName} joined!`);
    h3.innerText = `Room ${roomName} (${roomCount})`;
});

socket.on("bye", (nickname, roomCount) => {
    addMessage(`${nickname} left!`);
    h3.innerText = `Room ${roomName} (${roomCount})`;
});

socket.on("sendMessage", (nickName, msg) => {
    addMessage(`${nickName}: ${msg}`);
});

socket.on("room_change", (rooms) => {
    roomList.innerHTML = "";
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
});

socket.on("offer", async(offer) => {
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    myPeerConnection.addIceCandidate(ice);
});