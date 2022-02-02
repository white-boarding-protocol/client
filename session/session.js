import net from 'net';
import { threadId } from 'worker_threads';

class Session {

    #client_socket;

    constructor(ip_address, port_number) {
        try{
            console.log(ip_address +" "+port_number)
            this.#client_socket = net.createConnection({port: port_number, host: ip_address});
            console.log(this.#client_socket.pending)
        }catch(error){
            console.error(error);
        }
    }

    /**
     * Sends data to server when the socket is ready.
     * @param {*} data 
     * @returns boolean true if all data is flushed.
     */
    send_data(data){
        console.log(this.#client_socket.connecting)
        try{
            this.#client_socket.on('ready', () => {
                return this.#client_socket.write(data);
            });
        }catch(error){
            console.error(error);
        }
    }

    /**
     * receives data from server.
     * @returns data
     */
    recv_data(){
        try{
            this.#client_socket.on('data', (data) => {
                return data.toString();
            });
        }catch(error){
            console.error(error);
        }
    }

    /**
     * Closes the connection to the server.
     */
    close_connection(){
        this.#client_socket.destroy();
    }

}

export default Session