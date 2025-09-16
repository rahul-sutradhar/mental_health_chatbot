// Mental Health Support Chatbot JavaScript

class MentalHealthChatbot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.resetButton = document.getElementById('resetButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.crisisBanner = document.getElementById('crisis-banner');
        this.charCount = document.getElementById('charCount');
        
        this.isTyping = false;
        this.sessionId = null;
        
        this.initializeEventListeners();
        this.updateSendButton();
    }
    
    initializeEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter (but allow Shift+Enter for new lines)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea and update character count
        this.messageInput.addEventListener('input', () => {
            this.autoResize();
            this.updateCharacterCount();
            this.updateSendButton();
        });
        
        // Reset conversation
        this.resetButton.addEventListener('click', () => this.resetConversation());
        
        // Initial focus on input
        this.messageInput.focus();
    }
    
    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    updateCharacterCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = count;
        
        if (count > 900) {
            this.charCount.style.color = '#ff4757';
        } else if (count > 800) {
            this.charCount.style.color = '#ff9ff3';
        } else {
            this.charCount.style.color = '#999';
        }
    }
    
    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isTyping;
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input and reset height
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.updateCharacterCount();
        this.updateSendButton();
        
        // Show typing indicator
        this.showTyping();
        
        try {
            const response = await fetch('http://127.0.0.1:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store session ID if provided
                if (data.session_id) {
                    this.sessionId = data.session_id;
                }
                
                // Show crisis banner if crisis detected
                if (data.is_crisis) {
                    this.showCrisisBanner();
                }
                
                // Add bot response
                this.addMessage(data.response, 'bot');
            } else {
                // Handle error response
                this.addMessage(
                    data.error || 'Sorry, I encountered an issue. Please try again.',
                    'bot'
                );
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage(
                'I\'m sorry, I\'m having trouble connecting right now. Please try again in a moment, or contact campus support if you need immediate help.',
                'bot'
            );
        } finally {
            this.hideTyping();
        }
    }
    
    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? '👤' : '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Convert newlines to paragraphs and handle basic formatting
        const formattedContent = this.formatMessage(content);
        contentDiv.innerHTML = formattedContent;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    formatMessage(text) {
        // Convert newlines to paragraphs
        return text
            .split('\n\n')
            .map(paragraph => paragraph.trim())
            .filter(paragraph => paragraph.length > 0)
            .map(paragraph => `<p>${this.escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
            .join('');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showTyping() {
        this.isTyping = true;
        this.typingIndicator.classList.remove('hidden');
        this.updateSendButton();
        this.scrollToBottom();
    }
    
    hideTyping() {
        this.isTyping = false;
        this.typingIndicator.classList.add('hidden');
        this.updateSendButton();
    }
    
    showCrisisBanner() {
        this.crisisBanner.classList.remove('hidden');
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.crisisBanner.classList.add('hidden');
        }, 10000);
    }
    
    scrollToBottom() {
        // Use setTimeout to ensure DOM updates are complete
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
    
    async resetConversation() {
        if (confirm('Are you sure you want to start a new conversation? This will clear your current chat history.')) {
            try {
                await fetch('/reset', { method: 'POST' });
                
                // Clear chat messages except the initial bot message
                const firstMessage = this.chatMessages.querySelector('.bot-message');
                this.chatMessages.innerHTML = '';
                if (firstMessage) {
                    this.chatMessages.appendChild(firstMessage.cloneNode(true));
                }
                
                // Hide crisis banner
                this.crisisBanner.classList.add('hidden');
                
                // Reset session
                this.sessionId = null;
                
                // Focus input
                this.messageInput.focus();
                
            } catch (error) {
                console.error('Reset error:', error);
                alert('Failed to reset conversation. Please refresh the page.');
            }
        }
    }
}

// Utility functions for accessibility and user experience
function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        // Refocus input when user returns to tab
        const messageInput = document.getElementById('messageInput');
        if (messageInput && !messageInput.disabled) {
            messageInput.focus();
        }
    }
}

function handleError(error) {
    console.error('Application error:', error);
    
    // Show user-friendly error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-notification';
    errorMessage.innerHTML = `
        <p><strong>Something went wrong.</strong></p>
        <p>Please refresh the page or contact support if the problem continues.</p>
    `;
    document.body.appendChild(errorMessage);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorMessage.remove();
    }, 5000);
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize chatbot
        window.chatbot = new MentalHealthChatbot();
        
        // Add event listeners for better UX
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Global error handler
        window.addEventListener('error', handleError);
        
        console.log('Mental Health Support Chatbot initialized successfully');
    } catch (error) {
        console.error('Failed to initialize chatbot:', error);
        handleError(error);
    }
});

// Add some basic styles for error notifications
const errorStyles = `
.error-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4757;
    color: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-width: 300px;
    animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;

// Inject error styles
const styleSheet = document.createElement('style');
styleSheet.textContent = errorStyles;
document.head.appendChild(styleSheet);