import fs from "fs";
import Whiteboarding from "../whiteboarding/whiteboarding.js";
import {v4 as uuidv4} from 'uuid';

class Interface {

    constructor(userID, uri, cert_path, on_close) {
        this.userID = userID;
        this.whiteboarding = new Whiteboarding(userID, uri, {ca: fs.readFileSync(cert_path)}, () => on_close());
        this.errorMsg = null
    }

    async connect() {
        return await this.whiteboarding.start()
    }

    async createRoom() {
        let uuid = uuidv4();

        await this.whiteboarding.session.client_websocket.send(JSON.stringify({
            "type": 1,
            "room_event_type": 0,
            "user_id": this.userID,
            "uuid": uuid
        }));


        return new Promise((resolve, reject) => {
            this.whiteboarding.storage[uuid] = {
                res: (msg) => resolve(msg),
                rej: (msg) => reject(msg)
            }
        })
    }

    async Draw() {

    }

    async comment(text) {

    }

    async addStickNote() {
    }

    async addImage() {

    }

}

export default Interface
