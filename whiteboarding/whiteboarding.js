import Session from "../session/session.js";
import fs from 'fs';

class Whiteboarding {
    session;
    userID;

    constructor(userID, uri, cert_path, on_close) {

        this.ssl_context = {ca: fs.readFileSync(cert_path)};


        this.session = null
        this.uri = uri
        this.on_close = on_close
        this.userID = userID;
    }


    async start() {
        this.session = new Session(this.uri, this.ssl_context, (e) => this.on_message(e), () => this.on_open(), this.on_close);
        await new Promise(r => setTimeout(r, 3000));
    }

    async on_open(event) {
        await this.session.client_websocket.send(JSON.stringify({"user_id": this.userID, "message": "hello"}));
    }

    async on_message(event) {
        let data_obj = JSON.parse(event.data);
        switch (data_obj.status[0]) {
            case '1':
                await this.handle_user_events();
                break;
            case '2':
                await this.handle_host_events(data_obj);
                break;
            case '3':
                await this.handle_redistributed_events();
                break;
            case '4':
                await this.handle_error();
                break;
        }
    }


    async handle_user_events() {
        // 100 for user connect
        // 199 user disconnect
        // 101 joined room
        // 102 for join request is here for host
        // 103 join request successfully sent
        // 104 left room
    }

    async handle_host_events(data_obj) {
        
        switch(data_obj.status){
            case '201':
                // create room 201
                break;
            case '202':
                // accept user 202
                break;
            case '203':
                // decline user 203
                break;
            case '200':
                // end room 200
                break;    
        }        
    }

    async handle_redistributed_events() {

    }

    async handle_error() {

    }

}

export default Whiteboarding
