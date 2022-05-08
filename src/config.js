const debug = true;
const is_production = process.env.NODE_ENV === "production";
export default {
    debug: debug || !is_production,
    log_path: "logs",
    db_path: "data",
    port: 9000,
    ssl: {
        enable: false,
        cert: "",
        key: ""
    }
};
