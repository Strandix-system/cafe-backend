import SocketLog from "../model/socketLogs.js";

const saveSocketLog = async (logData) => {
    try {
        const log = new SocketLog(logData);
        await log.save();
    } catch (error) {
        console.log(error);
    };
};

export default saveSocketLog;