from flask import Flask, render_template, request, jsonify, session, send_from_directory
from flask_cors import CORS
import uuid
import os
from gemini import mental_health_chat, detect_crisis

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Configure CORS for all routes
app.secret_key = os.environ.get('SESSION_SECRET', 'dev-secret-key-change-in-production')

# Store conversation sessions in memory (use database in production)
conversations = {}

@app.route('/')
def index():
    """Serve the main chatbot interface"""
    return render_template('index.html')

@app.route('/chat', methods=['GET', 'POST'])
def chat():
    """Handle chat messages from the frontend"""
    try:
        if request.method != 'POST':
            return jsonify({'error': 'Method not allowed'}), 405
            
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        user_message = data.get('message', '').strip()
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        # Get or create session ID
        session_id = session.get('session_id')
        if not session_id:
            session_id = str(uuid.uuid4())
            session['session_id'] = session_id
            conversations[session_id] = []
        
        # Get conversation history for this session
        conversation_history = conversations.get(session_id, [])
        
        try:
            # Get AI response
            ai_response = mental_health_chat(user_message, conversation_history)
            
            # Check for crisis indicators
            is_crisis = detect_crisis(user_message)
            
            # Add crisis support information if needed
            if is_crisis:
                crisis_resources = """
🚨 **IMMEDIATE SUPPORT AVAILABLE:**
- **Crisis Text Line:** Text HOME to 741741
- **National Suicide Prevention Lifeline:** 988
- **Campus Counseling Center:** Contact your school's counseling services
- **Campus Security:** Call your campus emergency number

If you're in immediate danger, please call 911 or go to your nearest emergency room.
"""
                ai_response += crisis_resources
            
            # Update conversation history
            conv = conversations.setdefault(session_id, [])
            conv.append({
                "role": "user",
                "content": user_message
            })
            conv.append({
                "role": "model", 
                "content": ai_response
            })
            
            # Keep only last 20 messages
            if len(conv) > 20:
                conversations[session_id] = conv[-20:]
            
            return jsonify({
                'response': ai_response,
                'is_crisis': is_crisis,
                'session_id': session_id
            })
            
        except Exception as e:
            app.logger.exception("Error getting AI response")
            return jsonify({
                'error': 'AI service error',
                'response': 'I apologize, but I\'m experiencing technical difficulties right now. Please try again in a moment.'
            }), 503
            
    except Exception as e:
        app.logger.exception("Request processing error")
        return jsonify({
            'error': 'Server error',
            'response': 'Sorry, I encountered an unexpected error. Please try again.'
        }), 500

@app.route('/reset', methods=['POST'])
def reset_conversation():
    """Reset the current conversation"""
    session_id = session.get('session_id')
    if session_id and session_id in conversations:
        del conversations[session_id]
    session.pop('session_id', None)
    return jsonify({'status': 'reset'})

@app.route('/health')
def health_check():
    """Simple health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'Mental Health Support Chatbot'})

# Configure static file serving
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/<path:filename>')
def serve_file(filename):
    """Serve files from root directory"""
    return send_from_directory('static', filename)

if __name__ == '__main__':
    # Configure for development environment
    app.run(host='0.0.0.0', port=5000, debug=True)