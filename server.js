const net = require('net');
const fs = require('fs');

let clients = [];
let clientId = 0;

const logToFile = (message) => {
    fs.appendFile('chat.log', message + '\n', (err) => {
        if (err) console.error('Error writing to log file:', err.message);
    });
};

let server = net.createServer(client => {
    clientId++;
    client.id = `Client${clientId}`;
    clients.push(client);

    console.log(`${client.id} connected`);
    logToFile(`${client.id} connected`);

    // Send welcome message to the new client
    client.write(`Welcome, ${client.id}!\n`);

    // Notify all other clients
    clients.forEach(c => {
        if (c !== client) {
            c.write(`${client.id} has joined the chat.\n`);
        }
    });

    client.on('data', data => {
        const message = `${client.id}: ${data.toString().trim()}`;
        console.log(message);
        logToFile(message);

        // Broadcast the message to all other clients
        clients.forEach(c => {
            if (c !== client) {
                c.write(message + '\n');
            }
        });
    });

    client.on('end', () => {
        console.log(`${client.id} disconnected`);
        logToFile(`${client.id} disconnected`);

        // Remove the client from the list
        clients = clients.filter(c => c !== client);

        // Notify all other clients again
        clients.forEach(c => {
            c.write(`${client.id} has left the chat.\n`);
        });
    });

    client.on('error', err => {
        console.error(`Error with ${client.id}:`, err.message);
    });
}).listen(8080, () => {
    console.log('Server listening on port 8080');
});

server.on('error', err => {
    console.error('Server error:', err.message);
});