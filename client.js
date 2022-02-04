import Session from "./session/session.js";
import tls from 'tls';
import fs from 'fs';

// TODO: Later to be replaced with enc layer function
var ssl_context = tls.createSecureContext({ca: [ fs.readFileSync('./cert/cert.pem') ]})

// Session layer
var new_session = new Session("127.0.0.1", 5555, ssl_context);
new_session.send_data("Hello server, This is client!");
try{
    var data_from_server = await new_session.recv_data();
    console.log("Data from server: "+data_from_server.toString());
}catch{
    console.error("Error: Did not receive anything from server")
}
new_session.close_connection();
