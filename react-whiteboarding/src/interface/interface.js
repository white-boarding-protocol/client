import fs from "fs";
import Whiteboarding from "../whiteboarding/whiteboarding.js";
import {v4 as uuidv4} from 'uuid';

class Interface {

    constructor(userID, uri, certPath, onClose, loadPreviousEvents, onRejectJoin, onUserQueue, onWhiteboardEvent) {
        this.userId = userID;
        this.loadPreviousEvents = loadPreviousEvents
        this.onRejectJoin = onRejectJoin()
        this.roomId = null;
        this.whiteboarding = new Whiteboarding(userID, uri, {ca: fs.readFileSync(certPath)}, () => onClose(),
            (data) => onUserQueue(data), (event) => onWhiteboardEvent(event));

    }

    async connect() {
        return await this.whiteboarding.start()
    }

    async createRoom() {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 1,
            "room_event_type": 0,
            "user_id": this.userId,
            "uuid": uuid
        });

        return this.whiteboarding.setPromise(uuid).then((msg) => {
            console.log(this.roomId)
            this.roomId = msg.room_id
        })
    }


    async requestJoinRoom(roomId) {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 1,
            "room_event_type": 1,
            "user_id": this.userId,
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
                this.roomId = msg.room_id
                this.loadPreviousEvents(msg)
            }).catch((msg) => {
                //call the declined call back function
                this.onRejectJoin(msg)
            })
        })
    }

    async Draw(coordinates, color, tool, width) {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 2,
            "uuid": uuid,
            "user_id": this.userId,
            "room_id": this.roomId,
            "coordinates": coordinates,
            "action": 0,
            "color": color,
            "tool": tool,
            "width": width
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async acceptUserJoinRequest(userId) {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 1,
            "room_event_type": 4,
            "user_id": this.userId,
            "room_id": this.roomId,
            "target_user_id": userId,
            "uuid": uuid
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async comment(x, y, text, imageId) {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 5,
            "user_id": this.userId,
            "room_id": this.roomId,
            "x_coordinate": x,
            "y_coordinate": y,
            "action": 0,
            "text": text,
            "image_id": imageId,
            "uuid": uuid
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async addStickNote(text, x, y) {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 3,
            "user_id": this.userId,
            "room_id": this.roomId,
            "text": text,
            "x_coordinate": x,
            "y_coordinate": y,
            "action": 0,
            "uuid": uuid
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async addImage(x, y, data) {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 4,
            "user_id": this.userId,
            "room_id": this.roomId,
            "x_coordinate": x,
            "y_coordinate": y,
            "action": 0,
            "data": data,
            "uuid": uuid
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async leaveRoom() {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 1,
            "room_event_type": 2,
            "user_id": this.userId,
            "uuid": uuid,
            "room_id": this.roomId
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async endRoom() {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 1,
            "room_event_type": 3,
            "user_id": this.userId,
            "uuid": uuid,
            "room_id": this.roomId
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async declineJoin(targetUserId) {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 1,
            "room_event_type": 5,
            "user_id": this.userId,
            "uuid": uuid,
            "room_id": this.roomId,
            "target_user_id": targetUserId
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async removeStickNote(eventId) {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 3,
            "event_id": eventId,
            "action": 2,
            "user_id": this.userId,
            "room_id": this.roomId,
            "uuid": uuid
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async editStickNote(eventId, newText, newXCoordinate, newYCoordinate) {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 3,
            "text": newText,
            "x_coordinate": newXCoordinate,
            "y_coordinate": newYCoordinate,
            "action": 1,
            "event_id": eventId,
            "user_id": this.userId,
            "room_id": this.roomId,
            "uuid": uuid
        });

        return this.whiteboarding.setPromise(uuid)
    }

    async undo() {
        let uuid = uuidv4();

        await this.whiteboarding.sendData({
            "type": 6,
            "user_id": this.userId,
            "room_id": this.roomId,
            "uuid": uuid
        });

        return this.whiteboarding.setPromise(uuid)
    }
}

export default Interface
