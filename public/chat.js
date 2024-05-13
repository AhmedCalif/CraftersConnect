const io = require('socket.io');
const socket = io();

const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

socket.on('chat message', (msg) => {
    const message = document.createElement('div');
    message.textContent = msg;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
});

sendButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (messageInput.value.trim() !== '') { 
        const message = messageInput.value;
        socket.emit('chat message', message);
        messageInput.value = '';
    } else {
        console.log('Empty message cannot be sent');
    }
});
socket.on('connect_error', (err) => {
    console.error('Connection failed:', err);
});
