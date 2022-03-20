import Session from "../session/session.js";
import {v4 as uuidv4} from "uuid";


class Whiteboarding {
    session;
    userID;

    constructor(userID, uri, sslContext, onClose, onUserQueue, onNewMsg) {

        this.sslContext = sslContext
        this.onUserQueue = onUserQueue
        this.onNewMsg = onNewMsg
        this.session = null
        this.uri = uri
        this.onClose = onClose
        this.userID = userID;
        this.isConnected = false
        this.storage = {}
        this.pendingJoins = {}
    }

    async start() {
        let uuid = uuidv4()
        let promise = this.setPromise(uuid).then(() => {
            this.isConnected = true
        }).catch((reason) => {
            this.isConnected = false
            this.errorMsg = reason
        })

        this.session = new Session(this.uri, this.sslContext, (e) => this.on_message(e),
            () => this.on_open(uuid), this.onClose);
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
                this.storage[data_obj.uuid].res(data_obj)
                delete this.storage[data_obj.uuid]
                break;
            case 302:
                // accepted to the room
                this.pendingJoins[data_obj.room_id].res(data_obj)
                delete this.pendingJoins[data_obj.room_id]
                break;
            case 301:
                //user in queue
                this.onUserQueue(data_obj);
                break;
            case 300:
                //redist event
                await this.handle_redistributed_events(data_obj.event);
                break;
            case 400:
                this.storage[data_obj.uuid].rej(data_obj.message)
                delete this.storage[data_obj.uuid]
                break;
            case 401:
                //rejected to the room
                this.pendingJoins[data_obj.room_id].rej(data_obj.message)
                delete this.pendingJoins[data_obj.room_id]
                break;
            case 403:
                this.storage[data_obj.uuid].rej(data_obj.message)
                delete this.storage[data_obj.uuid]
                break;
        }
    }


    async handle_redistributed_events(data_obj) {
        this.onNewMsg(data_obj);
    }

    async handle_error(data_obj) {

    }


    setPromise(uuid) {
        return new Promise((resolve, reject) => {
            this.storage[uuid] = {
                res: (msg) => resolve(msg),
                rej: (msg) => reject(msg)
            }
        })
    }


    async sendData(data) {
        await this.session.client_websocket.send(JSON.stringify(data))
    }

}

export default Whiteboarding
