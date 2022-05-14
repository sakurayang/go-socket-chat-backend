import Log    from "../utils/logger.js";
import * as db   from "../utils/db.js";
import * as room from "../room/room.js";
import * as fs from "fs";
import config from "../config.js";
import * as path from "path";

const logger = Log("http");

const getQueryParams = (params, url) => {
    let href = url;
    // this is an expression to get query strings
    let regexp = new RegExp( '[?&]' + params + '=([^&#]*)', 'i' );
    let qString = regexp.exec(href);
    return qString ? qString[1] : null;
};

/**
 *
 * @param {Req} req
 * @param {Res} res
 */
export async function getRoomList(res, req) {
    let data = [];
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
        res.end(JSON.stringify({rooms: data}));
    })

}

/**
 *
 * @param {Req} req
 * @param {Res} res
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
            .end(JSON.stringify({status: data}));
    });
}

/**
 *
 * @param {Req} req
 * @param {Res} res
 */
export async function delRoom(res, req) {
    res.onAborted(() => {
        res.aborted = true;
    });
    let id = req.getParameter(0);
    await db.room.read();
    let result = await room.remove(id);
    if (result !== true) {
        res.writeStatus("503 Error " + result?.message || " ");
    } else {
        res.writeStatus("200 OK");
    }
    res.end(JSON.stringify({rooms: db.room.data, err: result?.message}) || JSON.stringify({rooms: db.room.data}));
}

/**
 *
 * @param {Req} req
 * @param {Res} res
 */
export async function createRoom(res, req) {
    res.onAborted(() => {
        res.aborted = true;
    });
    let id = req.getParameter(0);
    let parent_query = "?" + req.getQuery();
    let p = getQueryParams("parent", parent_query);
    let p_id = p || "";
    await db.room.read();
    let result = await room.create(id, p_id);
    if (result !== true) {
        res.writeStatus("503 Error " + result?.message || " ");
    } else {
        res.writeStatus("200 OK");
    }
    res.end(JSON.stringify({rooms: db.room.data, err: result?.message}) || JSON.stringify({rooms: db.room.data}));
}

const convert = (from, to) => str => Buffer.from(str, from).toString(to);
const u2h = convert('utf8', 'hex');
const h2u = convert('hex', 'utf8');

/**
 *
 * @param {Req} req
 * @param {Res} res
 */
export function fileUpload(res, req) {
    res.onAborted(() => {
        logger.debug("aborted");
    });

    let file_buffer = Buffer.from([]).fill(0);
    let length = 0;

    // multipart/form-data; boundary=----WebKitFormBoundaryLoL37AWYmzyoVRQo
    let [content_type, boundary, ...r] = req.getHeader("content-type").split(";");
    if (content_type.trim() !== "multipart/form-data") {
        res.writeStatus("406 Not Acceptable")
        .end("not ok", true);
    }
    boundary = boundary.split("=")[1].trim();

    res.onData((chunk, isLast) => {
        let buf = Buffer.from(chunk);
        length += chunk.byteLength;
        file_buffer = Buffer.concat([file_buffer, buf]);
        if (isLast) {
            res.end("ok");
            let parts = file_buffer.toString("hex");
            for (let part of parts) {
                if (part === boundary) { continue; }
                if (part === boundary + "--") { break; }
                logger.info(part);
            }
        }
    });
}
