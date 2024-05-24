const express = require('express');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let scriptRunning = false; // Variable para rastrear si el script está en ejecución

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('A client connected');
    
    // Notificar a los clientes sobre el estado del script
    socket.emit('script-status', scriptRunning);

    socket.on('run-script', () => {
        if (!scriptRunning) {
            scriptRunning = true;
            const scriptProcess = spawn('bash', ['script.sh']);

            scriptProcess.stdout.on('data', (data) => {
                const logs = data.toString();
                socket.emit('log', logs);
                // Write logs to a file (optional, for debugging or logging purposes)
                fs.appendFile('logs.txt', logs, err => {
                    if (err) {
                        console.error(`Error writing logs file: ${err}`);
                        return;
                    }
                    console.log('Logs appended to logs.txt');
                });
            });

            scriptProcess.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });

            scriptProcess.on('close', (code) => {
                console.log(`Script process exited with code ${code}`);
                scriptRunning = false;
                // Limpiar logs al finalizar el script
                fs.truncate('logs.txt', 0, (err) => {
                    if (err) {
                        console.error(`Error truncating logs file: ${err}`);
                        return;
                    }
                    console.log('Logs file truncated');
                });
                // Notificar a todos los clientes sobre el estado actual del script
                io.emit('script-status', scriptRunning);
            });
        } else {
            socket.emit('script-in-use');
        }
    });

    socket.on('disconnect', () => {
        console.log('A client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
