import EventAction from "../constants";

class ServerConnection{

  interfaceObject = null // sep's interface
  onMessageHandler = null // gui connector
  previousElements = []
  roomId = null
  userId = null

  constructor(interfaceObject) {
    this.interfaceObject = interfaceObject;
    this.interfaceObject.onWhiteboardEvent = this.onNewEvent;
    this.roomId = this.interfaceObject.roomId;
    this.userId = this.interfaceObject.userId;
  }

  setPreviousEvents(allPreviousEvents){
    for (const e in allPreviousEvents){
      this.previousElements.add( this.parseEventToElement(e) );
    }
  }

  setMessageHandler(onNewEvent) {
    this.onMessageHandler = onNewEvent
    this.previousElements.forEach( e => this.pushToUi(e) );
  }

  pushToUi(event){
    if (this.onMessageHandler !== null){
      const element = this.parseEventToElement(event);
      return this.onMessageHandler(element);
    }
  }

  onNewEvent(event){
    const element = this.parseEventToElement(event)
    const {x1, y1, type, extras} = element
      switch (type){
        case "image": // image
          break;

        case "note": // sticky note
          break;

        case "pencil": // draw
          break;

        default:
          break;
      }
  }

  /**
   * New element is created in the canvas. Post that as event in the server.
   * @param element
   */
  postElement(element){
    const event = this.parseElementToEvent(element, EventAction.CREATE);
    console.log("posting element to server ...", element)
    //todo: call server
    //todo: set id from the promise
  }

  updateElement(element){
    const event = this.parseElementToEvent(element, EventAction.CREATE);
    console.log("updating element to server ...", element)
    //todo: call server
  }

  remove(element){
    const event = this.parseElementToEvent(element, EventAction.CREATE);
    console.log("removing element from server ...", element)
    //todo: call server
  }

  postUndo(){
    console.log("undoing in server...")
    //todo: call server
  }

  /**
   * parse event json (server) to element json (client)
   */
  parseEventToElement(event){
    const {event_id, x_coordinate, y_coordinate} = event;
    const element = {
      "event_id": event_id,
      "action": event.action,
      "x1": x_coordinate,
      "y1": y_coordinate,
      "x2": x_coordinate,
      "y2": y_coordinate
    };
    switch (event.type){
      case 4: // image
        element.type = "image";
        element.extras = event.data;
        return element;

      case 3: // sticky note
        element.type = "image";
        element.extras = event.text;
        return element;

      case 2: // draw
        element.type = "pencil";
        element.extras = event.width;
        return element;

      case "comment":
        return null;

      default:
        return null;
    }
  }

  /**
   * parse element json (client) to event json (server)
   */
  parseElementToEvent(element, action){
    const {event_id, x1, y1, type, extras} = element
    const event = {
      "user_id": this.userId,
      "room_id": this.roomId,
      "event_id": event_id,
      "x_coordinate": x1,
      "y_coordinate": y1,
      "action": action
    }
    switch (type){
      case "image": // image
        event.type = 4;
        event.data = extras;
        return event;

      case "note": // sticky note
        event.type = 3;
        event.text = extras;
        return event;

      case "pencil": // draw
        event.type = 2;
        event.color = "black";
        event.tool = "pencil";
        event.width = extras;
        return event;

      case "comment":
        return null;

      default:
        return null;
    }
  }

}

export default ServerConnection;