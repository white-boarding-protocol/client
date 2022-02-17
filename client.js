import Session from "./session/session.js";
import fs from 'fs';

// TODO: Later to be replaced with enc layer function
const ssl_context = {ca: fs.readFileSync('./cert/cert.pem')}

// Session layer
const new_session = new Session("wss://SEP:5555", ssl_context);
