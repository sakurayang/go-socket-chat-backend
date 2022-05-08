import { Low, JSONFile, LowSync, MemorySync } from "lowdb";
import config from "../config.js";
import path from "path";

const room_file = path.join(config.db_path, "room.json");
const room_adapter = new JSONFile(room_file);
const room_db = new Low(room_adapter);

const status_adapter = new MemorySync();
const status_db = new LowSync(status_adapter);

export let init = async () => {
    await room_db.read();
    // if data is null

    /** @type {{rooms: import("./struct.d.ts").Room[]}}*/
    room_db.data ||= { rooms: [] };
    await room_db.write();

    // init
    await status_db.read();
    status_db.data ||= {
        /** @type {import("./struct.d.ts").Status} */
        status: {
            online: 0,
            rooms: 0
        }
    };
    await status_db.write();
};

export let room = room_db;
export let status = status_db;
