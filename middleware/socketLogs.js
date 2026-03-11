import { SocketLog } from "../model/socketLogs.js";

export const saveSocketLog = async (logData) => {
    try {
        const log = new SocketLog(logData);
        await log.save();
    } catch (error) {
        console.log(error);
    };
};


