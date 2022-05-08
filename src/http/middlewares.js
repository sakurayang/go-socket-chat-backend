import logger    from "../utils/logger.js";
import * as db   from "../utils/db.js";
import * as room from "../room/room.js";
import * as qs from "querystring2json";

/**
 *
 * @param {import("uWebSockets.js/index").HttpRequest} req
 * @param {import("uWebSockets.js/index").HttpResponse} res
 */
export async function getRoomList(res, req) {
    await db.room.read();
    let data = db.room.data;
    res.cork(()=>{
            res.writeStatus("200 OK")
            .writeHeader("Content-Type", "application/json")
            .end(JSON.stringify(data));
        });
}

/**
 *
 * @param {import("uWebSockets.js/index").HttpRequest} req
 * @param {import("uWebSockets.js/index").HttpResponse} res
 */
export async function getStatus(res, req) {
    await db.status.read();
    let data = db.status.data;
    res.cork(()=>{
        res.writeStatus("200 OK")
            .writeHeader("Content-Type", "application/json")
            .end(JSON.stringify(data));
    });
}

/**
 *
 * @param {import("uWebSockets.js/index").HttpRequest} req
 * @param {import("uWebSockets.js/index").HttpResponse} res
 */
export async function delRoom(res, req) {
    let id = req.getParameter(0);
    let result = room.remove(id);
    if (result !== true) {
        res.writeStatus("404 id not found");
    }
    res.writeStatus("200 OK");
    res.end();
}

/**
 *
 * @param {import("uWebSockets.js/index").HttpRequest} req
 * @param {import("uWebSockets.js/index").HttpResponse} res
 */
export async function createRoom(res, req) {
    let id = req.getParameter(0);
    let parent_query = req.getQuery();
    let p = qs.parse(parent_query);
    let p_id = p?.parent || "";
    let result = room.create(id, p_id);
    if (result !== true) {
        res.writeStatus("404 id not found");
    }
    res.writeStatus("200 OK");
    res.end();
}
