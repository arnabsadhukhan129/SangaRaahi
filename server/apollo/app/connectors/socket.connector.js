require('dotenv').config();
const { io } = require("socket.io-client");

const socket = io(process.env.SOCKET_DEMO_URL);
// const socket = io('https://demoyourprojects.com:6017/server');
socket.on("connect", () => {
    console.log("Connected to the socket server", socket.id); 
  });
  
  socket.on("disconnect", () => {
    console.log("Disconnected from the socket server");
  });

  socket.on("connect_error", (error) => {
    if (socket.active) {
      // console.log("temporary error. Socket will reconnect")
    } else {
      console.log("Socket connection error: ", error);
      socket.connect(); // Initiate a reconnect attempt
    }
  });

module.exports = socket;
