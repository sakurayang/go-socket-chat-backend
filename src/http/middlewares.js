import logger    from "../utils/logger.js";
import * as db   from "../utils/db.js";
import * as room from "../room/room.js";

const getQueryParams = (params, url) => {
    let href = url;
    // this is an expression to get query strings
    let regexp = new RegExp( '[?&]' + params + '=([^&#]*)', 'i' );
    let qString = regexp.exec(href);
    return qString ? qString[1] : null;
};

/**
 *
 * @param {import("uWebSockets.js/index").HttpRequest} req
 * @param {import("uWebSockets.js/index").HttpResponse} res
 */
export async function getRoomList(res, req) {
    let data = {rooms: []}
    res.onAborted(() => {
        res.aborted = true;
    });
    db.room.read().then( s => {
        data = db.room.data;
    }).catch(e => {
        console.log(e);
    }).finally(e => {
        res.writeStatus("200 OK");
        res.writeHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
    })

}

/**
 *
 * @param {import("uWebSockets.js/index").HttpRequest} req
 * @param {import("uWebSockets.js/index").HttpResponse} res
 */
export async function getStatus(res, req) {
    res.onAborted(() => {
        res.aborted = true;
    });
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
    res.onAborted(() => {
        res.aborted = true;
    });
    let id = req.getParameter(0);
    let result = await room.remove(id);
    if (result !== true) {
        res.writeStatus("503 Error " + result?.message || " ");
    } else {
        res.writeStatus("200 OK");
    }
    res.end(JSON.stringify({...db.room.data, err: result?.message}) || JSON.stringify(db.room.data));
}

/**
 *
 * @param {import("uWebSockets.js/index").HttpRequest} req
 * @param {import("uWebSockets.js/index").HttpResponse} res
 */
export async function createRoom(res, req) {
    res.onAborted(() => {
        res.aborted = true;
    });
    let id = req.getParameter(0);
    let parent_query = "?" + req.getQuery();
    let p = getQueryParams("parent", parent_query);
    let p_id = p || "";
    let result = await room.create(id, p_id);
    if (result !== true) {
        res.writeStatus("503 Error " + result?.message || " ");
    } else {
        res.writeStatus("200 OK");
    }
    res.end(JSON.stringify({...db.room.data, err: result?.message}) || JSON.stringify(db.room.data));
}
