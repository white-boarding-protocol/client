import fs from "fs";
import Whiteboarding from "../whiteboarding/whiteboarding";


class Interface {

    constructor(userID, uri, cert_path, on_close) {
        this.userID = userID;
        this.whiteboarding = new Whiteboarding(userID, uri, {ca: fs.readFileSync(cert_path)}, () => on_close());
    }

    async createRoom() {
        let uuid;
        await this.whiteboarding.session.client_websocket.send()
        let myFirstPromise = new Promise((resolve, reject) => {
            // We call resolve(...) when what we were doing asynchronously was successful, and reject(...) when it failed.
            // In this example, we use setTimeout(...) to simulate async code.
            // In reality, you will probably be using something like XHR or an HTML5 API.
            setTimeout( function() {
                resolve("Success!")  // Yay! Everything went well!
            }, 250)
        })

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
