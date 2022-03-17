import Session from "../session/session.js";
import Interface from "../interface/interface";

class Whiteboarding {
    session;
    userID;

    constructor(userID, uri, ssl_context, on_close) {

        this.ssl_context = ssl_context
        this.session = null
        this.uri = uri
        this.on_close = on_close
        this.userID = userID;
        this.storage = {
            uuid: Promise
        }

    }

    async start() {
        this.session = new Session(this.uri, this.ssl_context, (e) => this.on_message(e), () => this.on_open(), this.on_close);
    }

    async on_open(event) {
        await this.session.client_websocket.send(JSON.stringify({"user_id": this.userID, "message": "hello"}));
    }

    async on_message(event) {
        let data_obj = JSON.parse(event.data);
        switch (data_obj.status[0]) {
            case '1':
                this.whiteboarding.storage[uuid].resolve("success")
                await this.handle_user_events(data_obj);
                break;
            case '2':
                await this.handle_host_events(data_obj);
                break;
            case '3':
                await this.handle_redistributed_events(data_obj);
                break;
            case '4':
                await this.handle_error(data_obj);
                break;
        }
    }


    async handle_user_events(data_obj) {
        switch (data_obj.status) {
            case '100':
                // for user connect
                break;
            case '199':
                // user disconnect
                break;
            case '101':
                // joined room
                break;
            case '102':
                // for join request is here for host
                break;
            case '103':
                // join request successfully sent
                break;
            case '104':
                // left room
                break;
        }
    }

    async handle_host_events(data_obj) {

        switch (data_obj.status) {
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

    async handle_redistributed_events(data_obj) {

    }

    async handle_error(data_obj) {

    }

}

export default Whiteboarding
