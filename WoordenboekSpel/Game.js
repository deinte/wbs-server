class Game {
    rooms = [];

    constructor() {

    }

    joinRoom(socket, io, currentPlayer, room) {
        let roomName = room.roomName;
        room = this.rooms[this.getRoomIndexByName(roomName)];

        socket.join(roomName);

        currentPlayer.currentRoom = room.roomName;

        socket.username = room.roomName + "-" + currentPlayer.username;
        socket.join(socket.username);
        room.players.push(currentPlayer);

        socket.emit('joinedRoom', {room: room, players: room.players, currentPlayer: currentPlayer});
        socket.to(roomName).emit('updateRoom', room);
    }

    closeRoom(socket, io, room) {
        let roomName = room.roomName;
        socket.in(roomName).emit('closeRoom');
        if (this.rooms[this.getRoomIndexByName(roomName)] !== undefined) {
            this.rooms.splice(this.getRoomIndexByName(roomName), 1);
            console.log("ROOMS: ".red + roomName + " was deleted");
        }
    }

    generateRoomName(length = 5) {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    roomExists(roomName) {
        let toReturn = false;
        this.rooms.forEach((value, index) => {
            if(this.rooms[index].roomName === roomName) {
                toReturn = true;
            }
        });
        return toReturn;
    }

    getRoomIndexByName(name) {
        let toReturn = null;
        if(this.roomExists(name)) {
            this.rooms.forEach((value, index) => {
                if(value.roomName === name) {
                    toReturn = index;
                }
            })
        } else {
            console.log("ROOMS:".red + " not found")
        }
        return toReturn;
    }

}

module.exports = Game;