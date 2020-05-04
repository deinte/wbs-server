const express = require('express');
const app = express();
const http = require('http').createServer(app);
const colors = require('colors');
const Room = require('./WoordenboekSpel/Room.js');
const Player = require('./WoordenboekSpel/Player.js');
const Game = require('./WoordenboekSpel/Game.js');
const Turn = require('./WoordenboekSpel/Turn.js');
const Answer = require('./WoordenboekSpel/Answer.js');

let port = 3000;

let game = new Game();

// TODO rooms, players etc omzetten naar Game.js

const server = require('http').createServer();

const io = require('socket.io')(server, {
    path: '',
    serveClient: true,
    // below are engine.IO options
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
});
if (server.listen(port)) {
    console.log(("server:").toUpperCase().bgGreen.black + " connected running on port " + port.toString().green);
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log("CONNECTED: ".green + socket.id + " joined. There are " + Object.keys(io.sockets.clients().connected).length + " users connected");
    /** TODO Terug te fixen
     socket.on('resumeSession', data => {
        let user = data.user;
        let room = data.room;
        user.socketId = socket.id;
        if (rooms[room.roomName] !== undefined) {
            if(rooms[room.roomName].players.length >= 1) {
                socket.username = user;
                console.log("Session resumed");

                joinRoom(socket, io, user, room);
            } else {
                socket.emit('err', 'The room you were in before is empty, you can now make a new one.');
                closeRoom(socket, io, user, room);
            }
        } else {
            socket.emit('err', 'We couldn\'t find this room');
        }
        //console.log("Session of " + user.username.greenBG + " resumed with new socket id " + socket.id.greenBG);
    });
     */

    /**
     * Get info about the room. Used to check if there is a room available.
     * If room isn't found the server will send an error aswell.
     */
    socket.on('getRoomInfo', (data) => {
        if (game.roomExists(data.roomName)) {
            let room = game.rooms[game.getRoomIndexByName(data.roomName)];
            let roomName = room.roomName;
            let roomOwner = (room.roomOwner !== null) ? room.roomOwner : null;
            socket.emit('roomInfo', {
                roomName: roomName,
                roomOwner: roomOwner
            })
        } else {
            socket.emit('roomInfo', {
                roomName: null,
                roomOwner: null
            });
            if (data.page === undefined) {
                socket.emit('err', 'Kamer niet gevonden');
            }
        }
    });
    /**
     * If player left the room but socket keeps connected.
     * Remove player out of room
     */
    socket.on('playerLeft', (data) => {
        if (data.username !== undefined) {
            if (game.rooms[data.currentRoom] !== undefined) {
                let playerId = game.rooms[data.currentRoom].getIndexByName(data.username);
                rooms[data.currentRoom].players.splice(playerId);
                console.log(game.rooms[data.currentRoom]);
                socket.to(game.rooms[data.currentRoom].roomName).emit('updateRoom', game.rooms[data.currentRoom]);
            } else {
                console.log("PlayerLeft".red + " signal, but room was not found.")
            }
        } else {
            console.log("PlayerLeft".red + " signal, but no player was found.")
        }
    });
    /**
     * Create a new Room
     * Generate random 5-string roomName and check if the room exists.
     * Create room and push it to rooms array.
     */
    socket.on('createRoom', (data) => {
        let roomName = game.generateRoomName();
        while(game.roomExists(roomName)) {
            roomName = game.generateRoomName;
        }

        let currentPlayer = new Player(data.username, socket.id);
        socket.username = data.username;
        // Create room to rooms-array
        let currentRoom = new Room(roomName, data.roomPassword, currentPlayer);
        currentRoom.roomOwner = data.username;
        game.rooms.push(currentRoom);
        // Create currentplayer and let player join room
        game.joinRoom(socket, io, currentPlayer, currentRoom);
    });
    /**
     * Join room and send error when needed
     */
    socket.on('joinRoom', (data) => {
        let username = data.username;
        let roomName = data.roomName;
        socket.username = username;
        if (game.roomExists(roomName)) {
            let currentRoom = game.rooms[game.getRoomIndexByName(roomName)];
            if (currentRoom.password === data.password) {
                if (!currentRoom.usernameTaken(username)) {
                    let currentPlayer = new Player(username, socket.id);
                    game.joinRoom(socket, io, currentPlayer, currentRoom);
                } else {
                    socket.emit('err', 'Username already taken')
                }
            } else {
                socket.emit('err', 'Password of room was incorrect')
            }
        } else {
            socket.emit('err', 'Room not found, you could create one or join another room.')
        }
    });
    /**
     * startGame
     * First player in the room will have the first turn
     * He/she will be asked to fill in a word
     */
    socket.on('startGame', (data) => {
        console.log("startGame");
        let roomIndex = game.getRoomIndexByName(data.roomName);
        if(game.rooms[roomIndex] !== undefined) {
            game.rooms[roomIndex].currentTurn = new Turn(game.rooms[roomIndex].players[0].username);
            io.in(game.rooms[roomIndex].roomName).emit('newTurn', game.rooms[roomIndex].players[0].username);
        } else {
            console.log("ERROR: ".red + "Kamer niet gevonden.")
        }
    });
    /**
     * updateTurn
     */
    socket.on('submitWord', (data) => {
        console.log(data);
        let roomIndex = game.getRoomIndexByName(data.data.roomName);
        if(game.rooms[roomIndex] != undefined) {
            game.rooms[roomIndex].currentTurn.word = data.word;
            game.rooms[roomIndex].currentTurn.meaning = data.meaning;
            game.rooms[roomIndex].currentTurn.answers.push(new Answer(data.meaning, data.data.username));
            //console.log(game.rooms[roomIndex].currentTurn);
            io.in(game.rooms[roomIndex].roomName).emit('wordSubmitted', {
                word: data.turnWord,
                playerUsername: data.data.username
            });
        } else {
            console.log("ROOM: ".red + " Room was undefined");
        }
    })
    /**
     * If player disconnects
     * Check if player is in a room. If player is in a room,
     * set player to inActive.
     */
    socket.on('disconnect', () => {
        if(game.rooms !== undefined) {
            game.rooms.forEach(((value, index) => {
                let userIndex = game.rooms[index].getIndexBySocket(socket.id);
                if(userIndex !== null) {
                    game.rooms[index].setInActive(userIndex);
                    if(game.rooms[index].players.length > 0) {
                        game.rooms[index].roomOwner = game.rooms[index].players[0].username;
                        socket.to(game.rooms[index].roomName).emit('updateRoom', game.rooms[index]);
                    } else {
                        game.closeRoom(socket, io, game.rooms[index]);
                    }
                }
            }));
        } else {
            console.log("ROOMS: ".red + " No room found")
        }
        console.log("DISCONNECTED: ".red + ((socket.username === undefined) ? socket.id : socket.username) + " disconnected. There are " + Object.keys(io.sockets.clients().connected).length + " users connected");
    })
});

