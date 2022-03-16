import Session from "../session/session.js";
import fs from 'fs';

class Whiteboarding {
    session;
    userID;

    constructor(userID, uri, cert_path, on_close){

        const ssl_context = {ca: fs.readFileSync(cert_path)};


        this.session = new Session(uri, ssl_context, this.on_message, this.on_open, on_close);
        this.userID = userID;
    }

    on_open(){
        this.session.client_websocket.send({"user_id": this.userID, "message": "hello"});
    }

    on_message(data){
        data_obj = JSON.parse(data);
        switch(data_obj.status){
            case '300':
                //TODO:
                const message = data_obj.message;
            case '200':
                //TODO:

            case '403': 
                //TODO:
                
        }
    }

}

export default Whiteboarding