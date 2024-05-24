const express = require('express');
const { exec } = require('child_process');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const port = 3000;
const logFile = 'script.log';

// Ejecuta el script Bash y redirige la salida a un archivo de log
exec('bash script.sh > script.log 2>&1', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error ejecutando el script: ${error}`);
        return;
    }
    if (stderr) {
        console.error(`Error en stderr: ${stderr}`);
        return;
    }
    console.log(`Script ejecutado y log guardado en ${logFile}`);
});

// Configura el servidor WebSocket
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Cliente conectado');
    ws.send('Conexión establecida. Escuchando cambios en el log...');

    // Envía el contenido inicial del archivo de log
    fs.readFile(logFile, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error leyendo el archivo de log: ${err}`);
            ws.send(`Error leyendo el archivo de log: ${err}`);
            return;
        }
        ws.send(data);
    });
});

// Observa cambios en el archivo de log
chokidar.watch(logFile).on('change', (path) => {
    console.log(`Archivo de log cambiado: ${path}`);
    fs.readFile(logFile, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error leyendo el archivo de log: ${err}`);
            return;
        }
        // Envía el nuevo contenido del log a todos los clientes conectados
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });
});

// Inicia el servidor Express
app.get('/', (req, res) => {
    res.send('Servidor funcionando. Escuchando cambios en el log.');
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
