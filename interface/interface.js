import fs from "fs";
import Whiteboarding from "../whiteboarding/whiteboarding";
import { v4 as uuidv4 } from 'uuid';

class Interface {

    constructor(userID, uri, cert_path, on_close) {
        this.userID = userID;
        this.whiteboarding = new Whiteboarding(userID, uri, {ca: fs.readFileSync(cert_path)}, () => on_close());
    }

    async createRoom() {
        
        let uuid = uuidv4();

        await this.whiteboarding.session.client_websocket.send(JSON.stringify({"type": 1, "room_event_type": 0, 
        "user_id": this.userID, "uuid": uuid}));

        let myFirstPromise = new Promise();

        this.whiteboarding.storage[uuid] = {
            promis: myFirstPromise,
            msg: "success dude!"
        }
        
        return myFirstPromise
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
