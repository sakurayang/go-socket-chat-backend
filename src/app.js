import uWS from "uWebSockets.js";
import config from "./config.js";
import Log from "./utils/logger.js";
import {heart, init, status, user} from "./utils/db.js";
import * as middleware from "./http/middlewares.js";
import {handler} from "./socket/pubsub.js";

import {Worker} from "worker_threads";
import * as path from "path";


const logger = console;

(async () => await init())();

const app = config.ssl.enable
    ? uWS.SSLApp({
        key_file_name:  config.ssl.key,
        cert_file_name: config.ssl.cert
    })
    : uWS.App();

setInterval(() => {
    let time = +Date.now();
    heart.read();
    status.read();
    user.read();
    /** @type {Heart[]} */
    let h_data = heart.data;
    /** @type {User} */
    let u_data = user.data;
    /** @type {Status} */
    let s_data = status.data;
    h_data = h_data.filter(v => {
        let isTimeout = time - v.time > (5 * (60 + 1) * 1000);
        s_data.online -= isTimeout ? 1 : 0;
        for (let rid in u_data) {
            let u = u_data[rid];
            let i = u.findIndex(uv => uv.name === v.user)
            if (i !== -1) {
                let u_i = u[i];
                u_i.ws.close();
                u.splice(i, 1);
                u_data[rid] = u;
                break;
            }
        }
        return !isTimeout;
    });
    heart.write();
    status.write();
    user.write();
}, 5 * 60 * 1000);

app.ws("/ws", {
    /* Options */
    compression:      uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout:      16,
    /* Handlers */
    open:    (ws) => {

        logger.log("A WebSocket connected!");
        ws.send("hello");
    },
    message: (ws, message) => {
        //logger.log(ws, message);
        handler(message, ws);
        //const worker = new Worker(path.join("./", "socket/pubsub.js"));
        //worker.on("online")
    },
    drain:   (ws) => {
        logger.log("WebSocket backpressure: " + ws.getBufferedAmount());
    },
    close:   (ws, code, message) => {
        logger.log("WebSocket closed");
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
