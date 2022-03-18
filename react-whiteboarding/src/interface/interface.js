import Whiteboarding from "../whiteboarding/whiteboarding.js";
import {v4 as uuidv4} from 'uuid';

class Interface {

    constructor(userID, uri, certPath, onClose, loadRoom, onRejectJoin, onUserQueue) {
        this.userID = userID;
        this.loadRoom = loadRoom
        this.onRejectJoin = onRejectJoin()
        this.roomId = null;
        this.whiteboarding = new Whiteboarding(userID, uri, {
            // eslint-disable-next-line
            ca: "-----BEGIN CERTIFICATE-----\
        MIIDezCCAmOgAwIBAgIUD/CAMXv60OB/C0aQtUc6MlVz0Z0wDQYJKoZIhvcNAQEL\
        BQAwTTELMAkGA1UEBhMCRkkxDjAMBgNVBAgMBUVTUE9PMQ4wDAYDVQQHDAVFU1BP\
        TzEQMA4GA1UECgwHU0VQIExURDEMMAoGA1UEAwwDU0VQMB4XDTIyMDIwNDEzNTIz\
        MVoXDTIzMDIwNDEzNTIzMVowTTELMAkGA1UEBhMCRkkxDjAMBgNVBAgMBUVTUE9P\
        MQ4wDAYDVQQHDAVFU1BPTzEQMA4GA1UECgwHU0VQIExURDEMMAoGA1UEAwwDU0VQ\
        MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqXyiYWU70SzfzeAJn6GI\
        cAdGWuMThUow45w8ReOFhhGf8Y2dcVWrNYr/466IaqRpPJQmW691HMw050IjhHwE\
        HcMX67qVgQV79dfApBsiC1vt5NCbdUBMoBsDrv8wgAzcn9WNcnCoXw0fHcvwjyzH\
        9prmNpCOHguzTaE01/BSpEYdxBtj3zangYAboSmqfKYOCoEK6/PUkpPu+1kYqDRy\
        QOKshUkUVRrcPJ5PnwfOmeXO0iyzbjcOtPPDEqhPi5di6IzuntvoILFo2rHO/Tpp\
        Go8ygBWYBfSAmY3yBxdns1ndhhkQWqtXAGNoqRIs7g+NYxz1Dt1kvjtyjemOjMM+\
        6QIDAQABo1MwUTAdBgNVHQ4EFgQUyRp3n5mBcPMB38VT3chDkLlEazwwHwYDVR0j\
        BBgwFoAUyRp3n5mBcPMB38VT3chDkLlEazwwDwYDVR0TAQH/BAUwAwEB/zANBgkq\
        hkiG9w0BAQsFAAOCAQEARvhU+AQpSiZkqdQ/KF7SosPq9Z9a4GCMhQ/aeL+MTqb6\
        9UglsfzWqkoqmpXqM1UTKRugnzuqbm3hfoQ6vlO/vtTGBfrFfp2BbNPQvn7jRrEY\
        B3oInDFLwU06LVKWYOOyXyfjXgz3OMMB9IgCeMzgsDpDkeP8qYf1Ky0oLqP73Kx5\
        pJmnWr5TaPjlPVTX+vBBZsYEnDeDcQyujEeb88usGSr39NAPh1Gd7fccg4aedsSQ\
        5i3518P1BMEU+k3J3zzKJKTL0UCUVuXlf7HyYuE+WfptrBdAmIzaF0ws41C89T2W\
        rf1ZTygDcHYRE0b7D0fwe7X5o/3x0uL9praftBWIZQ==\
        -----END CERTIFICATE-----"
    }, () => onClose(),
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
            console.log(this.roomId)
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
                this.roomId = msg.room_id
                this.loadRoom(msg)
            }).catch((msg) => {
                //call the declined call back function
                this.onRejectJoin(msg)
            })
        })
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

    async Draw() {

    }

    async comment(text) {

    }

    async addStickNote() {
    }

    async addImage() {

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
}

export default Interface
