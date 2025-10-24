
// static/script.js

// This function will run for both authenticated and unauthenticated users
document.addEventListener('DOMContentLoaded', () => {

    // Check if the user is logged in by seeing if the chat container exists
    const mainChatContainer = document.querySelector('.main-chat');

    if (mainChatContainer) {
        // --- USER IS LOGGED IN ---
        setupChatApplication();
    } else {
        // --- USER IS NOT LOGGED IN ---
        setupAuthForms();
    }
});

// --- AUTHENTICATION LOGIC (UPDATED) ---
function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleLink = document.getElementById('toggle-form-link');
    const authTitle = document.getElementById('auth-title');
    const authError = document.getElementById('auth-error');

    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.toggle('hidden');
        registerForm.classList.toggle('hidden');

        if (registerForm.classList.contains('hidden')) {
            authTitle.textContent = 'Login';
            toggleLink.textContent = 'Need to create an account?';
        } else {
            authTitle.textContent = 'Register';
            toggleLink.textContent = 'Already have an account?';
        }
        authError.textContent = ''; // Clear errors on toggle
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // NEW: Check if the user is an admin
            if (data.is_admin) {
                window.location.href = '/admin'; // Redirect admin to dashboard
            } else {
                window.location.reload(); // Reload for regular users
            }
        } else {
            authError.textContent = data.error || 'Login failed.';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();

        if (response.ok) {
             // NEW: Check if the user is an admin (unlikely on register, but good practice)
             if (data.is_admin) {
                window.location.href = '/admin';
            } else {
                window.location.reload();
            }
        } else {
            authError.textContent = data.error || 'Registration failed.';
        }
    });
}


// --- MAIN CHAT APPLICATION LOGIC (Unchanged)---
function setupChatApplication() {
    // --- Get all DOM Elements ---
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const pastChatsList = document.getElementById('past-chats-list');
    const logoutBtn = document.getElementById('logout-btn');

    let currentChatId = null;

    // --- Core Chat Management Functions ---
    async function loadPastChats() {
        try {
            const response = await fetch('/chats');
            if (response.status === 401) window.location.reload();
            const chats = await response.json();

            pastChatsList.innerHTML = '';
            chats.forEach(chat => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = chat.title;
                a.setAttribute('data-chat-id', chat.id);

                if (chat.id === currentChatId) a.classList.add('active');

                a.onclick = (e) => {
                    e.preventDefault();
                    loadSpecificChat(chat.id);
                };
                
                const renameBtn = document.createElement('button');
                renameBtn.className = 'rename-btn';
                renameBtn.textContent = '✏️';
                renameBtn.title = 'Rename Chat';
                renameBtn.onclick = (e) => {
                    e.stopPropagation();
                    renameChat(chat.id, chat.title);
                };

                li.appendChild(a);
                li.appendChild(renameBtn);
                pastChatsList.appendChild(li);
            });
        } catch (error) {
            console.error('Failed to load past chats:', error);
        }
    }

    async function loadSpecificChat(chatId) {
        try {
            const response = await fetch(`/chats/${chatId}`);
            if(response.status === 401) window.location.reload();
            const messages = await response.json();

            chatWindow.innerHTML = '';
            currentChatId = chatId;

            messages.forEach(msg => {
                const sender = msg.role === 'user' ? 'user' : 'bot';
                addMessage(msg.content.replace(/\n/g, '<br>'), sender, false, msg.id);
            });

            loadPastChats();
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }

    function startNewChat() {
        currentChatId = null;
        chatWindow.innerHTML = `<div class="message bot-message"><p>Hello! Ask me any physics question.</p></div>`;
        loadPastChats();
    }

    newChatBtn.addEventListener('click', startNewChat);

    logoutBtn.addEventListener('click', async () => {
        await fetch('/logout');
        window.location.reload();
    });

    async function renameChat(chatId, currentTitle) {
        const newTitle = prompt("Enter a new name for the chat:", currentTitle);
        if (newTitle && newTitle.trim() !== '' && newTitle !== currentTitle) {
            try {
                const response = await fetch(`/rename_chat/${chatId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newTitle.trim() })
                });

                if (response.ok) {
                    loadPastChats();
                } else {
                    alert("Failed to rename chat.");
                }
            } catch (error) {
                console.error("Error renaming chat:", error);
            }
        }
    }
    
    // --- Message Sending Logic ---
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        addMessage(message, 'user', true, null);
        userInput.value = '';
        addMessage('Thinking...', 'bot', false, null);

        try {
            const response = await fetch('/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message, chat_id: currentChatId })
            });
            
            chatWindow.removeChild(chatWindow.lastChild);
            if (response.status === 401) window.location.reload();
            if (!response.ok) throw new Error('Server error');

            const data = await response.json();
            currentChatId = data.chat_id;

            const formattedResponse = data.response.replace(/\n/g, '<br>');
            addMessage(formattedResponse, 'bot', true, data.bot_message_id);

            loadPastChats();

        } catch (error) {
            chatWindow.removeChild(chatWindow.lastChild);
            addMessage('Error connecting to the server.', 'bot', true, null);
            console.error(error);
        }
    }

    // --- Add Message & Feedback ---
    function addMessage(message, sender, shouldSpeak, messageId) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        const p = document.createElement('p');
        p.innerHTML = message;
        messageDiv.appendChild(p);
        
        if (sender === 'bot' && messageId && message !== 'Thinking...') {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'feedback-buttons';
            feedbackDiv.innerHTML = `
                <button class="feedback-btn" data-message-id="${messageId}" data-feedback="1">👍</button>
                <button class="feedback-btn" data-message-id="${messageId}" data-feedback="-1">👎</button>
            `;
            messageDiv.appendChild(feedbackDiv);
        }

        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        if (sender === 'bot' && shouldSpeak) {
            speak(message);
        }
    }

    // --- Event Listeners ---
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    
    chatWindow.addEventListener('click', async (e) => {
        if (e.target.classList.contains('feedback-btn')) {
            const button = e.target;
            const messageId = button.dataset.messageId;
            const feedbackValue = parseInt(button.dataset.feedback, 10);
            try {
                const response = await fetch('/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message_id: messageId, feedback_value: feedbackValue })
                });

                if (response.ok) {
                    const parent = button.parentElement;
                    parent.querySelectorAll('.feedback-btn').forEach(btn => {
                        btn.disabled = true;
                        btn.style.opacity = '0.5';
                    });
                    button.style.opacity = '1';
                    button.style.backgroundColor = feedbackValue === 1 ? '#28a745' : '#dc3545';
                }
            } catch (error) {
                console.error("Error submitting feedback:", error);
            }
        }
    });
    
    // --- Helper Functions (TTS, STT) ---
    const voiceToggle = document.getElementById('voice-toggle');
    const voiceToggleLabel = document.querySelector('label[for="voice-toggle"]');
    const micBtn = document.getElementById('mic-btn');
    let mediaRecorder, audioChunks = [], isRecording = false;

    function updateVoiceToggleVisuals() { 
        if (voiceToggle.checked) { 
            voiceToggleLabel.textContent = '🔊'; 
            voiceToggleLabel.title = "Disable voice output"; 
        } else { 
            voiceToggleLabel.textContent = '🔇'; 
            voiceToggleLabel.title = "Enable voice output"; 
        } 
    }

    function speak(text) { 
        if (!voiceToggle.checked) return; 
        const textToSpeak = text.replace(/<br>/g, ' '); 
        const utterance = new SpeechSynthesisUtterance(textToSpeak); 
        window.speechSynthesis.cancel(); 
        window.speechSynthesis.speak(utterance); 
    }

    voiceToggle.addEventListener('change', () => { 
        updateVoiceToggleVisuals(); 
        if (!voiceToggle.checked) { 
            window.speechSynthesis.cancel(); 
        } 
    });

    async function handleMicClick() { 
        if (!isRecording) { 
            try { 
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); 
                mediaRecorder = new MediaRecorder(stream); 
                mediaRecorder.onstart = () => { 
                    audioChunks = []; 
                    isRecording = true; 
                    micBtn.classList.add('listening'); 
                    micBtn.textContent = '...'; 
                    userInput.placeholder = "Listening..."; 
                    voiceToggle.disabled = true; 
                }; 
                mediaRecorder.ondataavailable = event => { 
                    audioChunks.push(event.data); 
                }; 
                mediaRecorder.onstop = async () => { 
                    isRecording = false; 
                    micBtn.classList.remove('listening'); 
                    micBtn.textContent = '🎤'; 
                    userInput.placeholder = "Transcribing..."; 
                    voiceToggle.disabled = false; 
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); 
                    const formData = new FormData(); 
                    formData.append('audio_data', audioBlob, 'recording.webm'); 
                    try { 
                        const response = await fetch('/transcribe', { method: 'POST', body: formData }); 
                        const data = await response.json(); 
                        userInput.value = data.transcription || ''; 
                    } catch (error) { 
                        console.error('Transcription failed:', error); 
                    } finally { 
                        userInput.placeholder = "Type or click the mic to speak..."; 
                    } 
                }; 
                mediaRecorder.start(); 
            } catch (error) { 
                alert("Microphone access was denied."); 
            } 
        } else { 
            mediaRecorder.stop(); 
        } 
    }

    micBtn.addEventListener('click', handleMicClick);
    
    // Initial Load
    startNewChat();
    updateVoiceToggleVisuals();
}