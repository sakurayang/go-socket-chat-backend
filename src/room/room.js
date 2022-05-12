import { nanoid } from "nanoid";
import { room }  from "../utils/db.js";

/**
 * @param {Room[]} data
 * @param {string} id
 * @return {boolean}
 */
const idExist = (data, id) => data.findIndex(v => v.id === id) >= 0;

/**
 * @param {Room[]} data
 * @param {string} name
 */
const nameExist = (data, name) => data.findIndex(v => v.name === name) >= 0;

/**
 *
 * @param {string} name
 * @param {string} parent parent room id
 * @return {Promise <boolean | Error<string>>}
 */
export async function create(name, parent = "") {
    await room.read();
    /** @type {Room[]} */
    let data = room.data;
    if (nameExist(data, name)) {return new Error("name duplicate")}
    let id = nanoid(10);
    /** @type {string[]} */
    let sub = [];
    /** @type {Room} */
    let info = { id, name, sub, parent};

    if (parent !== "") {
        if (!idExist(data, parent)) { return new Error("parent id not exist") }
        await addSub(parent, id);
    }
    room.data.push(info);
    await room.write();
    return true;
}

/**
 *
 * @param {string}id
 * @return {Promise<Error | boolean>}
 */
export async function remove(id) {
    await room.read();
    /** @type {Room[]} */
    let data = room.data;
    if (!idExist(data, id)) { return new Error("id not exist") }
    let index = data.findIndex(v => v.id === id);
    if (data[index].sub.length !== 0 ) {
        let subs = data[index].sub;
        for (const sub of subs) {
            await delSub(id, sub);
        }
    }
    data.splice(index, 1);
    room.data= data;
    await room.write();
    return true;
}

/**
 * add a sub room
 * @param {string} id
 * @param {string} sub_id
 * @return {Promise<boolean | Error<string>>}
 */
export async function addSub(id, sub_id) {
    await room.read();
    /** @type {Room[]} */
    let data = room.data;
    let index = data.findIndex(v => v.id === id);
    if (isNaN(+index)) { return new Error("id not found") }
    if (room.data[index].parent !== "") { return new Error("can not create sub") }
    room.data[index].sub.push(sub_id);
    await room.write();
    return true;
}

/**
 * add a sub room
 * @param {string} id
 * @param {string} sub_id
 * @return {Promise<boolean | Error<string>>}
 */
export async function delSub(id, sub_id) {
    await room.read();
    /** @type {Room[]} */
    let data = room.data;
    let index = data.findIndex(v => v.id === id);
    if (isNaN(+index)) { return new Error("id not found") }

    let sub_index_in_parent = data[index].sub.findIndex(v => v === sub_id);
    let sub_index = data.findIndex(v => v.id === sub_id);
    data[index].sub.splice(sub_index_in_parent, 1);
    data.splice(sub_index, 1);

    room.data = data;
    await room.write();
    return true;
}

