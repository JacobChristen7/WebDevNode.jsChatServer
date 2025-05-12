const net = require('net');
const fs = require('fs');

let clients = [];
let clientId = 0;
const adminPassword = 'jacobsecretpassword'; // Admin password for /kick command

const logToFile = (message) => {
    fs.appendFile('chat.log', message + '\n', (err) => {
        if (err) console.error('Error writing to log file:', err.message);
    });
};

const findClientByName = (name) => {
    return clients.find(client => client.username === name);
};

let server = net.createServer(client => {
    clientId++;
    client.username = `Guest${clientId}`;
    clients.push(client);

    console.log(`${client.username} connected`);
    logToFile(`${client.username} connected`);

    // Send welcome message to the new client
    client.write(`Welcome, ${client.username}!\n`);

    // Notify all other clients
    clients.forEach(c => {
        if (c !== client) {
            c.write(`${client.username} has joined the chat.\n`);
        }
    });

    client.on('data', data => {
        const input = data.toString().trim();
        if (input.startsWith('/')) {
            handleCommand(client, input);
        } else {
            const message = `${client.username}: ${input}`;
            console.log(message);
            logToFile(message);

            // Broadcast the message to all other clients
            clients.forEach(c => {
                if (c !== client) {
                    c.write(message + '\n');
                }
            });
        }
    });

    client.on('end', () => {
        console.log(`${client.username} disconnected`);
        logToFile(`${client.username} disconnected`);

        // Remove the client from the list
        clients = clients.filter(c => c !== client);

        // Notify all other clients
        clients.forEach(c => {
            c.write(`${client.username} has left the chat.\n`);
        });
    });

    client.on('error', err => {
        console.error(`Error with ${client.username}:`, err.message);
    });
}).listen(8080, () => {
    console.log('Server listening on port 8080');
});

server.on('error', err => {
    console.error('Server error:', err.message);
});

const handleCommand = (client, input) => {
    const [command, ...args] = input.split(' ');

    switch (command) {
        case '/w': // Whisper command
            if (args.length < 2) {
                client.write('Error: Invalid number of arguments. Usage: /w <username> <message>\n');
                return;
            }
            const targetName = args[0];
            const message = args.slice(1).join(' ');
            const targetClient = findClientByName(targetName);

            if (!targetClient) {
                client.write(`Error: User ${targetName} not found.\n`);
            } else if (targetClient === client) {
                client.write('Error: You cannot whisper to yourself.\n');
            } else {
                targetClient.write(`(Whisper from ${client.username}): ${message}\n`);
                client.write(`(Whisper to ${targetName}): ${message}\n`);
                logToFile(`Whisper from ${client.username} to ${targetName}: ${message}`);
            }
            break;

        case '/username': // Change username command
            if (args.length !== 1) {
                client.write('Error: Invalid number of arguments. Usage: /username <new_username>\n');
                return;
            }
            const newUsername = args[0];
            if (newUsername === client.username) {
                client.write('Error: New username cannot be the same as the current username.\n');
            } else if (findClientByName(newUsername)) {
                client.write('Error: Username already in use.\n');
            } else {
                const oldUsername = client.username;
                client.username = newUsername;
                client.write(`Success: Your username has been changed to ${newUsername}.\n`);
                logToFile(`${oldUsername} changed their username to ${newUsername}`);
                clients.forEach(c => {
                    if (c !== client) {
                        c.write(`${oldUsername} is now known as ${newUsername}.\n`);
                    }
                });
            }
            break;

        case '/kick': // Kick command
            if (args.length !== 2) {
                client.write('Error: Invalid number of arguments. Usage: /kick <username> <admin_password>\n');
                return;
            }
            const kickTargetName = args[0];
            const password = args[1];
            const kickTarget = findClientByName(kickTargetName);

            if (password !== adminPassword) {
                client.write('Error: Incorrect admin password.\n');
            } else if (!kickTarget) {
                client.write(`Error: User ${kickTargetName} not found.\n`);
            } else if (kickTarget === client) {
                client.write('Error: You cannot kick yourself.\n');
            } else {
                kickTarget.write('You have been kicked from the chat.\n');
                kickTarget.end();
                clients = clients.filter(c => c !== kickTarget);
                logToFile(`${kickTargetName} was kicked by ${client.username}`);
                clients.forEach(c => {
                    c.write(`${kickTargetName} has been kicked from the chat.\n`);
                });
            }
            break;

        case '/clientlist': // List clients command
            const clientList = clients.map(c => c.username).join(', ');
            client.write(`Connected clients: ${clientList}\n`);
            break;

        case '/help': // Help command
            client.write(
                `Available commands:\n` +
                `/w <username> <message> - Send a private message to a specific user.\n` +
                `/username <new_username> - Change your username.\n` +
                `/kick <username> <admin_password> - Kick a user from the chat (admin only).\n` +
                `/clientlist - List all connected clients.\n` +
                `/help - Show this help message.\n`
            );
            break;

        default:
            client.write('Error: Unknown command.\n');
    }
};