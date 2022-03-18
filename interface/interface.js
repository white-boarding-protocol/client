import fs from "fs";
import Whiteboarding from "../whiteboarding/whiteboarding.js";
import {v4 as uuidv4} from 'uuid';
import { ThrowStatement } from "requirejs";

class Interface {

    constructor(userID, uri, certPath, onClose, loadRoom, onRejectJoin, onUserQueue) {
        this.userID = userID;
        this.loadRoom = loadRoom
        this.onRejectJoin = onRejectJoin()
        this.roomId = null;
        this.whiteboarding = new Whiteboarding(userID, uri, {ca: fs.readFileSync(certPath)}, () => onClose(),
            (data) => onUserQueue(data));

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

        return this.whiteboarding.setPromise(uuid).then((msg) => {
            this.roomId = msg.room_id
        })
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
                this.roomId = msg.roomId
                this.loadRoom(msg)
            }).catch((msg) => {
                //call the declined call back function
                this.onRejectJoin(msg)
            })
        })
    }

    async Draw(x, y, color, tool, width) {

        await this.whiteboarding.sendData({
            "type": 2,
            "user_id": this.userID,
            "room_id": this.roomId,
            "x_coordinate": x,
            "y_coordinate": y,
            "action": 0,
            "color": color,
            "tool": tool,
            "width": width

        });
    }

    async acceptUserJoinRequest(userId) {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 1,
            "room_event_type": 4,
            "user_id": this.userID,
            "room_id": this.roomId,
            "target_user_id": userId,
            "uuid": uuid
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async comment(x, y, text, imageId) {

        await this.whiteboarding.sendData({
            "type": 5,
            "user_id": this.userID,
            "room_id": this.roomId,
            "x_coordinate": x,
            "y_coordinate": y,
            "action": 0,
            "text": text,
            "image": imageId

        });

    }

    async addStickNote(text, x, y) {

        await this.whiteboarding.sendData({
            "type": 3,
            "user_id": this.userID,
            "room_id": this.roomId,
            "text": text,
            "x_coordinate": x,
            "y_coordinate": y,
            "action": 0

        });

    }

    async addImage(x, y, data, comments) {

        await this.whiteboarding.sendData({
            "type": 4,
            "user_id": this.userID,
            "room_id": this.roomId,
            "x_coordinate": x,
            "y_coordinate": y,
            "action": 0,
            "data": data,
            "comments": comments // list of ids.

        });

    }

    async leaveRoom() {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 1,
            "room_event_type": 2,
            "user_id": this.userID,
            "uuid": uuid,
            "room_id": this.roomId
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async endRoom(){
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 1,
            "room_event_type": 3,
            "user_id": this.userID,
            "uuid": uuid,
            "room_id": this.roomId
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async declineJoin(targetUserId){
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 1,
            "room_event_type": 5,
            "user_id": this.userID,
            "uuid": uuid,
            "room_id": this.roomId,
            "target_user_id": targetUserId
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async undo(){
        await this.whiteboarding.sendData({
            "type": 6,
            "user_id": this.userID,
            "room_id": this.roomId,
            "x_coordinate": x,
            "y_coordinate": y,
            "action": 2,
        });
    }
}

export default Interface
