const express = require('express');
const app = express();

const http = require('http');
const models = require('./models');
const {socketHandler} = require('./socket');

/**
 * Get port from environment and store in Express.
 */

const port = 3500;
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);
const io = require('socket.io')(server, {
    pingTimeout: 5000,
    pingInterval: 5000,
    cookie: false,
    serveClient: false,
});

const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'build')));

io.of('/').on('connection', socketHandler.bind(io));

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(3500);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

async function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    console.log('server listening on ' + bind);
}

