import {HttpRequest, HttpResponse} from "uWebSockets.js";
declare module "backend" {
    export type Room = {
        // nanoid here
        id: string,
        // name of room
        name: string,
        // a list of sub room id
        sub: string[],
        parent: string
    };

    export type Status = {
        // online count
        online: number,
        // room count
        rooms: number
    };

    export type User = Record<string, Array<{name: string, ws: WS}>>;

    export type Message = {
        type: "pub" | "sub" | "unsub" | "heart",
        room: string,
        name: string,
        msg: string,
        time: number
    }

    export type Heart = {
        user: string,
        time: Number
    }

    export type Res = HttpResponse
    export type Req = HttpRequest
    export type WS = WebSocket
}
