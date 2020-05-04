class Room {
    roomName = null;
    players = [];
    inActivePlayers = [];
    password = null;
    roomOwner = null;
    currentTurn = null;

    constructor(roomName, password, player) {
        this.roomName = roomName;
        this.password = password;
        this.roomOwner = player.username;
    }

    usernameTaken(input) {
        let toReturn = false;
        this.players.forEach(data => {
            if(data.username === input) {
                toReturn = true;
            }
        });
        if(toReturn === false) {
            this.inActivePlayers.forEach(data => {
                if(data.username === input) {
                    toReturn = true;
                }
            });
        }
        return toReturn;
    }

    inActiveUsernameTaken(input) {
        let toReturn = false;
        this.players.forEach(data => {
            if(data.username === input) {
                toReturn = true;
            }
        });
        return toReturn;
    }

    getIndexByName(playerName) {
        for(let i = 0; i < this.players.length; i++) {
            if(this.players[i].username === playerName) {
                return i;
            }
        }
    }

    getIndexBySocket(socketId) {
        let toReturn = null;
        this.players.forEach((value, index) => {
            if(value.socketId === socketId) {
                toReturn = index;
            }
        });
        return toReturn;
    }

    setInActive(index) {
        if(this.players[index] !== undefined) {
            if(this.inActiveUsernameTaken(this.players[index].username)) {
                console.log("PLAYERS: ".blue + (this.players[index].username).toString().bgBlue.black + " was set to inactive");
                this.inActivePlayers.push(this.players[index]);
                this.players.splice(index, 1);
            } else {
                console.log("PLAYERS: ".blue + " This username is already taken in our inactivelist");
            }
        } else {
            console.log("PLAYERS: ".blue + " Couldn't find player.");
        }
    }

}

module.exports = Room;