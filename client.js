//import Session from "./session/session.js";
import Whiteboarding from './whiteboarding/whiteboarding.js';
//import fs from 'fs';

// TODO: Later to be replaced with enc layer function
//const ssl_context = {ca: fs.readFileSync('./cert/cert.pem')}

// Session layer
//const new_session = new Session("wss://SEP:5555", ssl_context);

const wb = new Whiteboarding("123", "wss://SEP:5555", './cert/cert.pem', () => {
});
wb.start().then(() => {
})


