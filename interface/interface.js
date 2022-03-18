import fs from "fs";
import Whiteboarding from "../whiteboarding/whiteboarding.js";
import {v4 as uuidv4} from 'uuid';

class Interface {

    constructor(userID, uri, certPath, onClose, loadRoom, onRejectJoin) {
        this.userID = userID;
        this.loadRoom = loadRoom
        this.onRejectJoin = onRejectJoin()
        this.whiteboarding = new Whiteboarding(userID, uri, {ca: fs.readFileSync(certPath)}, () => onClose());
    }

    async connect() {
        return await this.whiteboarding.start()
    }

    async createRoom() {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 1,
            "room_event_type": 0,
            "user_id": this.userID,
            "uuid": uuid
        });

        return this.whiteboarding.setPromise(uuid)
    }


    async requestJoinRoom(roomId) {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 1,
            "room_event_type": 1,
            "user_id": this.userID,
            "room_id": roomId,
            "uuid": uuid
        });

        return this.whiteboarding.setPromise(uuid).then(() => {
            new Promise((resolve, reject) => {
                this.whiteboarding.pendingJoins[roomId] = {
                    rej: (msg) => reject(msg),
                    res: (msg) => resolve(msg),
                }
            }).then((msg) => {
                //call the joined call back function
                this.loadRoom(msg)
            }).catch((msg) => {
                //call the declined call back function
                this.onRejectJoin(msg)
            })
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
