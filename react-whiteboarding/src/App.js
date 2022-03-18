import logo from './logo.svg';
import './App.css';

//import Session from "./session/session.js";
import Interface from "./interface/interface.js";
//import fs from 'fs';

// TODO: Later to be replaced with enc layer function
//const ssl_context = {ca: fs.readFileSync('./cert/cert.pem')}

// Session layer
//const new_session = new Session("wss://SEP:5555", ssl_context);

const wb = new Interface("150", "wss://SEP:5555", './cert/cert.pem', () => {
}, (msg) => {
    console.log("loading room")
    wb.leaveRoom().then(() => {
        console.log("left room")
    })
}, (msg) => {
    console.log("host declined")
}, (msg) => {
    wb.acceptUserJoinRequest(msg.user_id).then((msg) => {
        console.log("accepted user request to join")
    })
});


wb.connect().then(() => {
    console.log(wb.whiteboarding.isConnected)
    wb.requestJoinRoom("room_8271a968-a6ab-11ec-8631-acde48001122").then((msg) => {
        console.log("accepted")
    }).catch((msg) => {
        console.log("declined")
    })
})

//
// wb.connect().then(() => {
//     console.log(wb.whiteboarding.isConnected)
//     wb.createRoom().then((msg) => {
//         console.log(msg)
//     }).catch((msg) => {
//         console.log(msg)
//     })
// })

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React ??
        </a>
      </header>
    </div>
  );
}

export default App;
