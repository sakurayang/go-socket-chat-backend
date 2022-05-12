import { Low, JSONFile, LowSync, MemorySync } from "lowdb";
import config from "../config.js";
import path from "path";

const room_file = path.join(config.db_path, "room.json");
const room_adapter = new JSONFile(room_file);
const room_db = new Low(room_adapter);

const status_db = new LowSync(new MemorySync());

const user_db = new LowSync(new MemorySync());

const heart_db = new LowSync(new MemorySync());

export let init = async () => {
    await room_db.read();
    // if data is null

    /** @type {Room[]}*/
    room_db.data = room_db.data || [];
    await room_db.write();

    // init
    await status_db.read();
    /** @type {Status} */
    status_db.data = status_db.data || {
            online: 0,
            rooms: 0
    };
    await status_db.write();

    await user_db.read();
    /** @type {User} */
    user_db.data = user_db.data || {};
    await user_db.write();

    await heart_db.read();
    /** @type {Heart[]} */
    heart_db.data = heart_db.data || [];
    await heart_db.write();
};

export let room = room_db;
export let status = status_db;
export let user = user_db;
export let heart = heart_db;
