const { Client } = require("ssh2");



module.exports = (socket, io) => {

    // ACCESS TO SSH TERMINAL

    let currentStream = null; // Store the active SSH stream

    // ✅ Define whitelisted commands
    const WHITELISTED_COMMANDS = ["pm2 restart 0", "pm2 logs", "pm2 list"];

    socket.on("command", (cmd) => {

        if (!WHITELISTED_COMMANDS.includes(cmd)) {
            socket.emit("terminal-output", `❌ Command not allowed: ${cmd}\n`);
            return;
        }

        const conn = new Client();

        conn.on("ready", () => {

            conn.exec(cmd, (err, stream) => {
                if (err) {
                    socket.emit("terminal-output", `❌ Error: ${err.message}\n`);
                    return;
                }

                currentStream = stream;

                stream.on("data", (data) => {
                    socket.emit("terminal-output", data.toString());
                });

                stream.stderr.on("data", (data) => {
                    socket.emit("terminal-output", `❌ Error: ${data.toString()}`);
                });

                stream.on("close", () => {
                    socket.emit("terminal-output", "\n✅ Command finished\n");
                    currentStream = null;
                    conn.end();
                });
            });
        }).on("error", (err) => {
            socket.emit("terminal-output", `❌ SSH Error: ${err.message}\n`);
        }).connect({
            host: process.env.SSH_HOST,
            port: process.env.SSH_PORT,
            username: process.env.SSH_USER,
            password: process.env.SSH_PASS
        });
    });

    // ✅ Fetch Server Status
    socket.on("fetch-server-status", () => {
        const conn = new Client();

        conn.on("ready", () => {

            conn.exec("uptime && pm2 list", (err, stream) => {
                if (err) {
                    socket.emit("server-status", `❌ Error: ${err.message}\n`);
                    return;
                }

                let output = "";

                stream.on("data", (data) => {
                    output += data.toString();
                });

                stream.stderr.on("data", (data) => {
                    output += `❌ Error: ${data.toString()}`;
                });

                stream.on("close", () => {
                    socket.emit("server-status", output);
                    conn.end();
                });
            });
        }).on("error", (err) => {
            socket.emit("server-status", `❌ SSH Error: ${err.message}\n`);
        }).connect({
            host: process.env.SSH_HOST,
            port: process.env.SSH_PORT,
            username: process.env.SSH_USER,
            password: process.env.SSH_PASS
        });
    });


    // ALLOWED IPS
    const allowedIps = process.env.ALLOWED_TERMINAL_IPS?.split(",") || [];

    const ip = socket.request.headers['x-forwarded-for']
    ? socket.request.headers['x-forwarded-for'].split(',')[0].trim()
    : socket.request.connection.remoteAddress;

    // CHECK IF CLIENT IS ALLOWED TO ACCESS THE TERMINAL
    const checkIfAllowed = (data) => {
    if (allowedIps.includes(ip)) {
        socket.emit('access_status', {status: true})
      } else {
        socket.emit('access_status', {status: false})
      }
    }

    socket.on('check_if_allowed', checkIfAllowed)
}