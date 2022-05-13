import {user, room, status, heart} from "../utils/db.js";
import Log from "../utils/logger.js";

const logger = Log("socket");

/**
 *
 * @param {String} id
 * @param {Room[]} data
 * @return {Boolean}
 */
const room_exist = (id, data) => data.findIndex(v => v.id === id) >= 0 ;

/**
 * handler for all type of message
 * @param {String | ArrayBuffer} msg
 * @param {WS} ws
 */
export async function handler(msg, ws) {

    const dec = new TextDecoder();
    /** @type {Message} */
    let m = JSON.parse(dec.decode(new Uint8Array(msg)));

    switch (m.type) {
        default:
        case "pub": {
            await pub(m, ws);
            break;
        }
        case "sub": {
            await sub(m, ws);
            break;
        }
        case "unsub": {
            await unsub(m, ws);
            break;
        }
        case "heart": {
            await heart_beat(m, ws)
            break;
        }
    }

}

/**
 * message parser
 *
 */
async function parser() {}

/**
 * handle client pub
 * @param {Message} msg,
 * @param {WS} ws
 */
async function pub(msg, ws) {
    let {room} = msg;
    await boardcast(JSON.stringify(msg), room, ws)
}

/**
 * handle client sub
 * @param {Message} msg
 * @param {WS} ws
 */
async function sub(msg, ws) {
    await user.read();
    await room.read();
    /** @type {User} */
    let u_data = user.data;
    /** @type {Room[]} */
    let r_data = room.data;
    let {room: room_id, name} = msg;

    if (!room_exist(room_id, r_data)) {
        ws.send(JSON.stringify({err: "room not exist"}));
        return;
    }

    if (!(room_id in u_data) || u_data[room_id].length === 0) {
        u_data[room_id] = [{name, ws}];
    } else {
        u_data[room_id].push({name, ws});
    }

    await user.write();
    ws.send("ok");
    let room_name = r_data[r_data.findIndex(v => v.id === room_id)].name;
    server_boardcast(`${name} 加入了 ${room_name}`).then();
}

/**
 * handle client unsub
 * @param {Message} msg
 * @param {WS} ws
 * @return {Promise<void>}
 */
export async function unsub(msg, ws) {
    await user.read();
    await room.read();
    /** @type {User} */
    let u_data = user.data;
    /** @type {Room[]} */
    let r_data = room.data;
    let {room: room_id, name} = msg;

    if (!(room_id in u_data) || u_data[room_id].length === 0) {
        return ;
    } else {
        let r = u_data[room_id];
        let r_c = [...r];
        for (let i = 0; i < r.length; i++) {
            let u = r[i];
            if (u.name === name) {
                r_c.splice(i, 1);
            }
        }
        u_data[room_id] = r_c;
    }

    await user.write();
    ws.close();
    let room_name = r_data[r_data.findIndex(v => v.id === room_id)].name;
    server_boardcast(`${name} 离开了 ${room_name}`).then();
}

/**
 * handle heart beat
 * @param {Message} msg
 * @param {WS} ws
 */
async function heart_beat(msg, ws) {
    await status.read();
    await heart.read();
    /** @type {Status} */
    let s_data = status.data;
    /** @type {Heart[]} */
    let h_data = heart.data;

    let {name: user, time} = msg;
    let index = h_data.findIndex(v => v.user === user);
    if (index >= 0) {
        h_data[index].time = time;
    } else {
        h_data.push({user, time});
        s_data.online += 1;
        await status.write();
    }
    ws.send(JSON.stringify(s_data));
}

/**
 * boardcast
 * @param {string} msg,
 * @param {string} room_id,
 * @param {WS} ws
 */
async function boardcast(msg, room_id, ws) {
    await user.read();
    /** @type {User} */
    let u_data = user.data;
    if (room_id in u_data) {
        let r = u_data[room_id];
        for (const u of r) {
            try {
                u.ws.readyState === 1 && u.ws.send(JSON.stringify(msg))
            } catch (e) {
                logger.error(e);
            }

        }
    } else {
        await room.read();
        /** @type {Room[]} */
        let r_data = room.data;
        if (room_exist(room_id, r_data)) {
            ws.send(JSON.stringify({err: "room not exist"}));
        } else {
            u_data[room_id].push(ws);
            await user.write();
            for (const u of u_data[room_id]) {
                u.ws.send(JSON.stringify(msg))
            }
        }
    }
}

export async function server_boardcast(msg) {
    await user.read();
    /** @type {User} */
    let u_data = user.data;
    for (const u in u_data) {
        /** @type {Message} */
        const send_message = {
            msg: `[notice: ${msg}]`,
            user: "server",
            type: "pub",
            room: u,
            time: +new Date()
        };
        // pub -> boardcast
        // the ws param only use if room id not exist
        // but here we assume the room id always exist
        // cause it use the user db
        await pub(send_message, null);
    }
}
