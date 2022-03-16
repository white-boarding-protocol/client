import WebSocket from 'ws';

class Session {

    client_websocket;

    /**
     * Creates a net socket and wraps it around tls using tls module. It needs tls.SecureContext from encryption layer.
     * @param {*} ip_address Address to connect to
     * @param {*} port_number Port number to connect to
     * @param {*} ssl_context tls.SecureContext object that is passed to session layer from the encryption layer
     */
    constructor(uri, ssl_context, on_message, on_open, on_close) {
        try {
            console.log(`INFO: Client will attempt connection to ${uri}`)

            // Create client websocket.
            this.client_websocket = new WebSocket(uri, ssl_context);

            this.client_websocket.addEventListener("message", on_message);
            this.client_websocket.addEventListener("open", on_open);
            this.client_websocket.addEventListener("close", on_close);
            this.client_websocket.addEventListener("error", this.on_error);

        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Sends data to server when the socket is ready.
     * @param {*} data
     * @returns boolean true if all data is flushed to kernel socket.
     */
    send_data(data) {
        try {
            return this.client_websocket.send(JSON.stringify(data))
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Closes the connection to the server.
     */
    close_connection() {
        this.client_websocket.close();
    }


    on_error(event) {
        console.log(event)
    }

}

export default Session
