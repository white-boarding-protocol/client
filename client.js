import Session from "./session/session.js";
import tls from 'tls';
import fs from 'fs';

// TODO: To be changed with enc layer functions to provide ssl context.
var ssl_context = tls.createSecureContext({ca: [ fs.readFileSync('./cert/cert.pem') ]})

var new_session = new Session("127.0.0.1", 5555, ssl_context);
var data_from_server = await new_session.recv_data();
console.log("From server: "+data_from_server.toString());
new_session.send_data("Hello server, This is client!");
new_session.close_connection();
