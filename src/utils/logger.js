import config from "../config.js";
import log4js from "log4js";
import path from "path";
log4js.configure({
    appenders: {
        all: {
            type: "file",
            filename: path.join(
                config.log_path,
                `${new Date().toISOString().substring(0, 10)}.log`
            ),
            compress: true,
        },
        ws: {
            type: "file",
            filename: path.join(
                config.log_path,
                `${new Date().toISOString().substring(0, 10)}.websocket.log`
            ),
            compress: true,
        },
        http: {
            type: "file",
            filename: path.join(
                config.log_path,
                `${new Date().toISOString().substring(0, 10)}.http.log`
            ),
            compress: true,
        },
        ...(config.debug
            ? {
                out: {
                    type: "stdout",
                    layout: {
                        type: "coloured",
                    },
                },
                err: {
                    type: "stderr",
                    layout: {
                        type: "coloured",
                    },
                },
            }
            : {}),
    },
    categories: {
        default: {
            appenders: ["all", ...(config.debug ? ["out"] : [])],
            level: "info",
        },
        core: {
            appenders: ["all", ...(config.debug ? ["out"] : [])],
            level: "info",
        },
        database: {
            appenders: ["all", ...(config.debug ? ["out"] : [])],
            level: "debug",
        },
        ws: {
            appenders: ["ws", ...(config.debug ? ["out"] : [])],
            level: "info",
        },
        http: {
            appenders: ["http", ...(config.debug ? ["out"] : [])],
            level: "info",
        },
        ...(config.debug
            ? {
                err: {
                    appenders: ["err"],
                    level: "error",
                },
            }
            : {}),
    },
});

export default name => log4js.getLogger(name);
