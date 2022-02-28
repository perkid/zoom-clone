import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

// app.listen(3000);

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

function handleListen() {
    console.log("Listening on http://localhost:3000");
}

const sockets = [];

wss.on("connection", (socket) => {
    // console.log(socket);
    sockets.push(socket);
    socket["nickname"] = "anon";
    console.log("Connected to Browser");
    socket.on("close", () => console.log("Disconnected from Browser"));
    socket.on("message", (msg) => {
        // console.log(message.toString('utf8'));
        // socket.send(message);
        let message = JSON.parse(msg);
        console.log(message.type)
        switch (message.type) {
            case "message":
                sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${message.payload}`));
                break;
            case "nickName":
                socket["nickname"] = message.payload;
                break;
        }
    })
    // socket.send("hello!!");
});

server.listen(3000, handleListen);