document.addEventListener('DOMContentLoaded', (event) => {
  const socket = new WebSocket('ws://localhost:8000');
  
  const messageForm = document.getElementById('message-form');
  const messagesDiv = document.getElementById('messages');
  const messageInput = document.getElementById('message');
  const receiverIdSelect = document.getElementById('receiver-id');
  const chatContainer = document.querySelector('.chat-container');
  const projectId = chatContainer.getAttribute('data-project-id');

  if (!projectId) {
    console.error('Project ID is not defined');
    return;
  }

  // Function to load messages
  const loadMessages = () => {
    console.log('Loading messages...');
    fetch(`/projects/chat?projectId=${projectId}`)
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
      })
      .then(data => {
        console.log('Messages loaded:', data.chats);
        if (!data.chats) {
          console.error('No chats found');
          return;
        }
        // Clear existing messages on initial load
        messagesDiv.innerHTML = '';
        data.chats.forEach(chat => {
          appendMessage(chat.senderUsername, chat.lastMessage);
        });
      })
      .catch(error => console.error('Error loading messages:', error));
  };

 
  const appendMessage = (username, message) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${username}: ${message}`;
    messagesDiv.appendChild(messageElement);
  };

  // Initial load of messages
  loadMessages();

  // Handle form submission
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = {
      message: messageInput.value,
      receiverId: receiverIdSelect.value,
      projectId: projectId,
      username: '<%= user.username %>' 
    };

    fetch(`/projects/chat?projectId=${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => { throw new Error(text) });
      }
      return response.json();
    })
    .then(data => {
      console.log('Message sent:', data);
      messageInput.value = '';
      // Emit the new message via WebSocket
      socket.send(JSON.stringify(data.newMessage));
    })
    .catch(error => console.error('Error sending message:', error));
  });

  // Listen for new messages from the WebSocket server
  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    console.log('New message received:', data);
    appendMessage(data.username, data.message);
  });
});
