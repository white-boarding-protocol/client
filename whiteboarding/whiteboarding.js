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
        console.log(data_obj)

        switch (data_obj.status) {

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
