import http from "http";
// import WebSocket from "ws";
import express from "express";
import SocketIO, { Socket } from "socket.io";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

// app.listen(3000);

const httpsServer = http.createServer(app);
// const wss = new WebSocket.Server({server});
const io = SocketIO(httpsServer);

function handleListen() {
    console.log("Listening on http://localhost:3000");
}

// const sockets = [];

// wss.on("connection", (socket) => {
//     // console.log(socket);
//     sockets.push(socket);
//     socket["nickname"] = "anon";
//     console.log("Connected to Browser");
//     socket.on("close", () => console.log("Disconnected from Browser"));
//     socket.on("message", (msg) => {
//         // console.log(message.toString('utf8'));
//         // socket.send(message);
//         let message = JSON.parse(msg);
//         console.log(message.type)
//         switch (message.type) {
//             case "message":
//                 sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${message.payload}`));
//                 break;
//             case "nickName":
//                 socket["nickname"] = message.payload;
//                 break;
//         }
//     })
//     // socket.send("hello!!");
// });

function publicRooms() {
    // const sids = io.sockets.adapter.sids;
    // const rooms = io.sockets.adapter.rooms;
    const {
        sockets: {
            adapter: { sids, rooms},
        },
    } = io;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

function countRoom(roomName) {
    return io.sockets.adapter.rooms.get(roomName)?.size;
}

io.on("connection", (socket) => {
    // socket.onAny((event) => {
    //     console.log(`Socket Event:${event}`);
    // });
    socket.on("room", (roomName, nickname) => {
        socket.join(roomName);
        socket["nickname"] = nickname;
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
        io.sockets.emit("room_change", publicRooms()); // 전체 서버에 보내주는것
    });
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });
    socket.on("sendMessage", (msg, room, done) => {
        done();
        socket.to(room).emit("sendMessage", socket.nickname, msg);
    })
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => {
            socket.to(room).emit("bye", socket.nickname, countRoom(room)-1);
        });
    });
    socket.on("disconnect", () => {
        io.sockets.emit("room_change", publicRooms());
    });
});

httpsServer.listen(3000, handleListen);