import Session from "../session/session.js";
import {v4 as uuidv4} from "uuid";


class Whiteboarding {
    session;
    userID;

    constructor(userID, uri, ssl_context, on_close) {

        this.ssl_context = ssl_context
        this.session = null
        this.uri = uri
        this.on_close = on_close
        this.userID = userID;
        this.isConnected = false
        this.storage = {}
    }

    async start() {
        let uuid = uuidv4()
        let promise = new Promise((resolve, reject) => {
            this.storage[uuid] = {
                res: (msg) => resolve(msg),
                rej: (msg) => reject(msg),
                promise: null
            }
        }).then(() => {
            this.isConnected = true
        }).catch((reason) => {
            this.isConnected = false
            this.errorMsg = reason
        })

        this.storage[uuid].promise = promise
        this.session = new Session(this.uri, this.ssl_context, (e) => this.on_message(e),
            () => this.on_open(uuid), this.on_close);
        return promise
    }

    async on_open(uuid) {
        await this.session.client_websocket.send(JSON.stringify({
            "user_id": this.userID,
            "message": "hello",
            "uuid": uuid
        }));
    }

    async on_message(event) {
        let data_obj = JSON.parse(event.data);
        console.log(data_obj)

        switch (data_obj.status) {
            case 200:
                this.storage[data_obj.uuid].res(data_obj.message)
                break;
            case 301:
                // user in queue
                break;
            case 300:
                //redist event
                await this.handle_redistributed_events(data_obj);
                break;
            case 400:
                this.storage[data_obj.uuid].rej(data_obj.message)
                break;
            case 403:
                this.storage[data_obj.uuid].rej(data_obj.message)
                break;
        }
    }


    async handle_redistributed_events(data_obj) {

    }

    async handle_error(data_obj) {

    }

}

export default Whiteboarding
