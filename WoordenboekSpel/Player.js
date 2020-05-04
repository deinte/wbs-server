class Player {
    username = null;
    currentRoom = null;
    points = 0;
    likes = 0;
    socketId;

    constructor(username = "Anonymous", socketId) {
        this.socketId = socketId;
        this.username = username;
    }

}

module.exports = Player;