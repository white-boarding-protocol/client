import Session from "./session/session.js";
import net from "net";

// THIS WORKS OK
var sock = net.createConnection(5555, "127.0.0.1", function() {
    console.log('Client Connected');
});
sock.addListener('data', (data) => {
    console.log(data.toString());
});
//console.log(sock)
sock.write("Hello Server!");


// SESSION DOES NOT CONNECT NOT THROW AN ERROR, IT JUST STAYS PENDING ???
/*
var newSession = new Session("127.0.0.1", 5555);
//console.log(newSession.recv_data());
newSession.send_data("Hello server, This is client!");
newSession.close_connection();
*/