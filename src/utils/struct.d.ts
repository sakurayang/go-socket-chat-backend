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
