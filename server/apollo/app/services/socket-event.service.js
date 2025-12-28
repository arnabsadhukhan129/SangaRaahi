const socket = require('../connectors/socket.connector');
const SERVER_SOCKET_COMMAND = process.env.SERVER_SOCKET_COMMAND || 'command';
const SocketEvent = {
    doCheckInEvent(eventId, userId, data) {
        const command = 'check_in_event';
        const socketData = {
            command,
            data,
            userId,
            eventId
        };
        socket.emit(SERVER_SOCKET_COMMAND, socketData);
    }
}

module.exports = SocketEvent;