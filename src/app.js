import uWS             from "uWebSockets.js";
import config          from "./config.js";
import Log             from "./utils/logger.js";
import {init}          from "./utils/db.js";
import * as middleware       from "./http/middlewares.js";

const logger = Log("core");

(async () => await init())();

const app = config.ssl.enable
    ? uWS.SSLApp({
        key_file_name:  config.ssl.key,
        cert_file_name: config.ssl.cert
    })
    : uWS.App();

app.ws("/ws", {
    /* Options */
    compression:      uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout:      16,
    /* Handlers */
    open:    (ws) => {

        logger.log("A WebSocket connected!");
    },
    message: (ws, message, isBinary) => {
        /* Ok is false if backpressure was built up, wait for drain */
        let ok = ws.send(message, isBinary);
    },
    drain:   (ws) => {
        console.log("WebSocket backpressure: " + ws.getBufferedAmount());
    },
    close:   (ws, code, message) => {
        console.log("WebSocket closed");
    }
}).get("/status", middleware.getStatus)
    .get("/room", middleware.getRoomList)
    .del("/room/:id", middleware.delRoom)
    .put("/room/:id", middleware.createRoom)
    .listen(config.port, token => {
    if (token) {
        console.log("Listening to port " + config.port);
    } else {
        console.log("Failed to listen to port " + config.port);
    }
});
