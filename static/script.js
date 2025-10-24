// static/script.js

// The single source of truth for your backend's URL.
const API_URL = 'https://physics-chatbot-bd3o.onrender.com';

// This is the new entry point for the entire application.
// It runs when the page is loaded and decides what to show the user.
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
});

/**
 * Checks with the backend if a user is currently logged in.
 * Based on the response, it shows either the chat app or the login form.
 */
async function checkAuthentication() {
    try {
        const response = await fetch(`${API_URL}/api/check_auth`, {
            credentials: 'include' // IMPORTANT: Sends the session cookie to the backend.
        });

        if (!response.ok) {
            throw new Error('Auth check failed with status: ' + response.status);
        }

        const data = await response.json();

        if (data.logged_in) {
            // If logged in, hide the login view and show the main chat app.
            document.getElementById('auth-view').classList.add('hidden');
            document.getElementById('chat-app').classList.remove('hidden');
            // Initialize the chat application with user data.
            setupChatApplication(data.username, data.is_admin);
        } else {
            // If not logged in, show the login view and hide the chat app.
            document.getElementById('auth-view').classList.remove('hidden');
            document.getElementById('chat-app').classList.add('hidden');
            // Initialize the login/register forms.
            setupAuthForms();
        }
    } catch (error) {
        console.error("Could not connect to the backend for auth check:", error);
        // If the backend is down or there's an error, default to showing the login form.
        document.getElementById('auth-view').classList.remove('hidden');
        document.getElementById('chat-app').classList.add('hidden');
        setupAuthForms();
    }
}


/**
 * Sets up all event listeners and logic for the login/register forms.
 */
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
        authTitle.textContent = registerForm.classList.contains('hidden') ? 'Login' : 'Register';
        toggleLink.textContent = registerForm.classList.contains('hidden') ? 'Need to create an account?' : 'Already have an account?';
        authError.textContent = '';
    });

    const handleAuthResponse = async (response) => {
        const data = await response.json();
        if (response.ok) {
            // On successful login/register, simply reload the page.
            // The checkAuthentication() function will then run again and show the correct UI.
            window.location.reload();
        } else {
            authError.textContent = data.error || 'An unknown error occurred.';
        }
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        await handleAuthResponse(response);
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        await handleAuthResponse(response);
    });
}


/**
 * Sets up all event listeners and logic for the main chat application.
 * @param {string} username - The username of the logged-in user.
 * @param {boolean} isAdmin - Whether the user is an admin.
 */
function setupChatApplication(username, isAdmin) {
    // --- Populate user-specific elements ---
    document.getElementById('welcome-message').textContent = `Welcome, ${username}`;
    if (isAdmin) {
        document.getElementById('admin-link-btn').classList.remove('hidden');
    }

    // --- Get all DOM Elements ---
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const pastChatsList = document.getElementById('past-chats-list');
    const logoutBtn = document.getElementById('logout-btn');

    let currentChatId = null;

    // --- Core Chat Management Functions ---
    const fetchWithCredentials = (url, options = {}) => {
        return fetch(url, { ...options, credentials: 'include' });
    };

    async function loadPastChats() {
        try {
            const response = await fetchWithCredentials(`${API_URL}/chats`);
            if (response.status === 401) window.location.reload();
            const chats = await response.json();
            pastChatsList.innerHTML = '';
            chats.forEach(chat => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = chat.title;
                a.dataset.chatId = chat.id;
                if (chat.id === currentChatId) a.classList.add('active');
                a.onclick = (e) => { e.preventDefault(); loadSpecificChat(chat.id); };
                
                const renameBtn = document.createElement('button');
                renameBtn.className = 'rename-btn';
                renameBtn.textContent = '✏️';
                renameBtn.title = 'Rename Chat';
                renameBtn.onclick = (e) => { e.stopPropagation(); renameChat(chat.id, chat.title); };
                
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
            const response = await fetchWithCredentials(`${API_URL}/chats/${chatId}`);
            if(response.status === 401) window.location.reload();
            const messages = await response.json();
            chatWindow.innerHTML = '';
            currentChatId = chatId;
            messages.forEach(msg => addMessage(msg.content.replace(/\n/g, '<br>'), msg.role === 'user' ? 'user' : 'bot', false, msg.id));
            loadPastChats();
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }

    function startNewChat() {
        currentChatId = null;
        chatWindow.innerHTML = `<div class="message bot-message"><p>Hello! Ask me any physics question.</p></div>`;
        document.querySelectorAll('#past-chats-list a').forEach(el => el.classList.remove('active'));
    }

    newChatBtn.addEventListener('click', startNewChat);

    logoutBtn.addEventListener('click', async () => {
        await fetchWithCredentials(`${API_URL}/logout`);
        window.location.reload();
    });

    async function renameChat(chatId, currentTitle) {
        const newTitle = prompt("Enter a new name for the chat:", currentTitle);
        if (newTitle && newTitle.trim() !== '' && newTitle !== currentTitle) {
            const response = await fetchWithCredentials(`${API_URL}/rename_chat/${chatId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle.trim() })
            });
            if (response.ok) loadPastChats(); else alert("Failed to rename chat.");
        }
    }
    
    // --- Message Sending Logic ---
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        addMessage(message, 'user', true, null);
        userInput.value = '';
        const thinkingMessage = addMessage('Thinking...', 'bot', false, null);

        try {
            const response = await fetchWithCredentials(`${API_URL}/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message, chat_id: currentChatId })
            });
            
            thinkingMessage.remove();
            if (response.status === 401) window.location.reload();
            if (!response.ok) throw new Error('Server error');

            const data = await response.json();
            currentChatId = data.chat_id;
            const formattedResponse = data.response.replace(/\n/g, '<br>');
            addMessage(formattedResponse, 'bot', true, data.bot_message_id);
            if (!document.querySelector(`[data-chat-id='${currentChatId}']`)) loadPastChats();
        } catch (error) {
            thinkingMessage.remove();
            addMessage('Error connecting to the server.', 'bot', true, null);
        }
    }

    // --- Add Message & Feedback ---
    function addMessage(message, sender, shouldSpeak, messageId) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `<p>${message}</p>`;
        if (sender === 'bot' && messageId && message !== 'Thinking...') {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'feedback-buttons';
            feedbackDiv.innerHTML = `<button class="feedback-btn" data-message-id="${messageId}" data-feedback="1">👍</button><button class="feedback-btn" data-message-id="${messageId}" data-feedback="-1">👎</button>`;
            messageDiv.appendChild(feedbackDiv);
        }
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        if (sender === 'bot' && shouldSpeak) speak(message);
        return messageDiv;
    }

    // --- Event Listeners ---
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    
    chatWindow.addEventListener('click', async (e) => {
        if (e.target.classList.contains('feedback-btn')) {
            const button = e.target;
            const response = await fetchWithCredentials(`${API_URL}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_id: button.dataset.messageId, feedback_value: parseInt(button.dataset.feedback, 10) })
            });
            if (response.ok) {
                const parent = button.parentElement;
                parent.querySelectorAll('.feedback-btn').forEach(btn => { btn.disabled = true; btn.style.opacity = '0.5'; });
                button.style.opacity = '1';
                button.style.backgroundColor = button.dataset.feedback === '1' ? '#28a745' : '#dc3545';
            }
        }
    });
    
    // --- Helper Functions (TTS, STT) ---
    const voiceToggle = document.getElementById('voice-toggle');
    const voiceToggleLabel = document.querySelector('label[for="voice-toggle"]');
    const micBtn = document.getElementById('mic-btn');
    let mediaRecorder, audioChunks = [], isRecording = false;

    function updateVoiceToggleVisuals() { 
        voiceToggleLabel.textContent = voiceToggle.checked ? '🔊' : '🔇'; 
        voiceToggleLabel.title = voiceToggle.checked ? "Disable voice output" : "Enable voice output"; 
    }

    function speak(text) { 
        if (!voiceToggle.checked) return; 
        window.speechSynthesis.cancel(); 
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(text.replace(/<br>/g, ' '))); 
    }

    voiceToggle.addEventListener('change', () => { 
        updateVoiceToggleVisuals(); 
        if (!voiceToggle.checked) window.speechSynthesis.cancel(); 
    });

    micBtn.addEventListener('click', async () => { 
        if (!isRecording) { 
            try { 
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); 
                mediaRecorder = new MediaRecorder(stream); 
                mediaRecorder.onstart = () => { audioChunks = []; isRecording = true; micBtn.classList.add('listening'); micBtn.textContent = '...'; userInput.placeholder = "Listening..."; }; 
                mediaRecorder.ondataavailable = event => audioChunks.push(event.data); 
                mediaRecorder.onstop = async () => { 
                    isRecording = false; micBtn.classList.remove('listening'); micBtn.textContent = '🎤'; userInput.placeholder = "Transcribing..."; 
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); 
                    const formData = new FormData(); 
                    formData.append('audio_data', audioBlob); 
                    try { 
                        const response = await fetch(`${API_URL}/transcribe`, { method: 'POST', body: formData, credentials: 'include' }); 
                        const data = await response.json(); 
                        userInput.value = data.transcription || ''; 
                    } catch (error) { 
                        console.error('Transcription failed:', error); 
                    } finally { 
                        userInput.placeholder = "Type or click the mic to speak..."; 
                    } 
                }; 
                mediaRecorder.start(); 
            } catch { alert("Microphone access was denied."); } 
        } else { mediaRecorder.stop(); } 
    });
    
    // Initial Load for a logged-in user
    startNewChat();
    loadPastChats();
    updateVoiceToggleVisuals();
}