import { waitForDebugger } from 'inspector';
import net from 'net';
import { ThrowStatement } from 'requirejs';
import tls from 'tls';

class Session {

    #client_socket;
    #client_ssl_socket;
    #received_data;
    #data_available = false;

    /**
     * Creates a net socket and wraps it around tls using tls module. It needs tls.SecureContext from encryption layer.
     * @param {*} ip_address Address to connect to
     * @param {*} port_number Port number to connect to
     * @param {*} ssl_context tls.SecureContext object that is passed to session layer from the encryption layer
     */
    constructor(ip_address, port_number, ssl_context) {
        try{
            console.log("INFO: Client will attempt connection to ip: "+ip_address + ", port: " + port_number)
            
            // Create client socket.
            this.#client_socket = net.createConnection({port: port_number, host: ip_address});

            // warp the socket around tls.
            this.#client_ssl_socket = tls.connect({
                socket: this.#client_socket, 
                servername: "SEP", 
                secureContext: ssl_context
                },
                ()=>{
                    // Must check if socket authorized manually.
                    console.log("INFO: Secure connection established with server.")
                    if(!this.#client_ssl_socket.authorized){
                        console.error("ERROR: Socket was not authorized, could not determine if the server certificate was signed by one of the specified CAs.");
                        console.error("ERROR: "+this.#client_ssl_socket.authorizationError);
                        this.#client_ssl_socket.end();
                    }else{
                        console.log("INFO: Secure Socket was authorized successfully using certificate.");
                    }
                },
                );

            // LISTENERS

            // Listener for incoming data.
            this.#client_ssl_socket.addListener('data', (data)=>{
                console.log("INFO: Listener received data from server.");
                //console.log(data.toString());
                this.#received_data = data;
                this.#data_available = true;
            })

            // Listener for closing the socket if server closes first.
            this.#client_ssl_socket.addListener('end', (data)=>{
                console.log("INFO: Server closed socket. Closing client socket...");
                this.#client_ssl_socket.end();
            })
            
            // Listener for catching networking errors.
            this.#client_ssl_socket.addListener('error', (error)=>{
                console.log("INFO: Listener caught an error...");
                console.error("ERROR: "+error);
            })

            // Listener for catching tls errors.
            this.#client_ssl_socket.addListener('tlsClientError', (tls_error)=>{
                console.log("INFO: Listener caught a tls error...");
                console.error("ERROR: "+tls_error);
            })            
                        
            
            //console.log(this.#client_ssl_socket);
        }catch(error){
            console.error(error);
        }
    }

    /**
     * Sends data to server when the socket is ready.
     * @param {*} data 
     * @returns boolean true if all data is flushed to kernel socket.
     */
    send_data(data){
        // console.log(this.#client_ssl_socket.connecting)
        try{
            return this.#client_ssl_socket.write(data);
        }catch(error){
            console.error(error);
        }
    }

    /**
     * Receives data from server.
     * The function returns a promise instead of directly returning the value to avoid returning undefined when 
     * the socket listener takes time to fetch data.
     * @returns a promise that might contain data received from socket listener.
     */
    recv_data() {
        return new Promise( (resolve, reject)=>{
            // Wait 200 ms then try returning data received from socket listener.
            setTimeout(()=>{
                // resolve data.
                if(this.#data_available){
                    this.#data_available = false;
                    resolve(this.#received_data);
                }else{
                    reject("Error: promise timed out before receiving any data.");
                }
            }, 200)
        })
    }

    /**
     * Closes the connection to the server.
     */
    close_connection(){
        this.#client_ssl_socket.end();
    }

}

export default Session