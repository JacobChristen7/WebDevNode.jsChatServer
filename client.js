const net = require('net');
const readline = require('readline');

let client = net.createConnection({ port: 8080 }, () => {
    console.log('Connected to server!');
    console.log('If you wish to exit, type "/exit" in the chat and press Enter.');
    console.log('For a list of commands, type "/help" in the chat and press Enter.');
});

client.on('data', data => {
    console.log(data.toString().trim());
});

client.on('end', () => {
    console.log('Disconnected from server');
});

client.on('error', err => {
    console.error('Connection error:', err.message);
});

// Forward input from stdin
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', input => {
    if (input.trim().toLowerCase() === '/exit') {
        console.log('Disconnecting from server...');
        client.end(); // Disconnect from the server
        rl.close(); // Close the readline interface
    } else {
        client.write(input); // Send the input to the server
    }
});