# Overview

This is a mental health support chatbot designed specifically for higher education students. The application provides a safe, web-based conversational interface where students can discuss their feelings and receive empathetic support powered by Google's Gemini AI. The chatbot is trained to recognize crisis situations and provide appropriate resources while offering evidence-based coping strategies for common student challenges like academic stress, social pressures, and life transitions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend uses a traditional multi-page application (MPA) approach with server-rendered HTML templates using Flask's Jinja2 templating engine. The user interface is built with vanilla HTML, CSS, and JavaScript without any frontend frameworks, keeping the implementation simple and lightweight. The design features a gradient background, sticky header, and responsive chat interface optimized for both desktop and mobile devices.

The chat interface implements real-time messaging simulation with typing indicators, auto-resizing text areas, and character count limits. CSS uses modern features like flexbox and grid for responsive layout, with a cohesive green color scheme that conveys safety and wellness.

## Backend Architecture
The backend is built on Flask, a lightweight Python web framework, following a simple request-response pattern. The application uses session-based conversation management stored in server memory, with each user session identified by a UUID. This approach was chosen for simplicity but would need database persistence for production use.

The core chatbot functionality is separated into a dedicated `gemini.py` module that handles AI interactions and crisis detection. This separation allows for easier testing and potential future expansion to different AI providers.

## AI Integration
The system integrates with Google's Gemini AI using the new `google-genai` SDK (specifically the gemini-2.5-flash model). The AI is configured with specialized prompts for mental health support, focusing on empathetic responses while maintaining appropriate boundaries around medical advice and crisis intervention.

Crisis detection is implemented as a separate function that analyzes user messages for keywords indicating potential self-harm or suicidal ideation, triggering additional safety resources when detected.

## Security and Session Management
The application uses Flask's built-in session management with server-side session storage. Session secrets are configured via environment variables for production security. Conversations are stored in-memory during development but would require database persistence for production deployment.

# External Dependencies

## Core Framework Dependencies
- **Flask**: Web framework for handling HTTP requests and rendering templates
- **Google GenAI SDK**: Integration with Google's Gemini AI models for natural language processing

## AI Services
- **Google Gemini API**: Powers the conversational AI responses with the gemini-2.5-flash model
- **Crisis Detection**: Custom implementation using keyword analysis for identifying mental health emergencies

## Frontend Libraries
- **Google Fonts**: Inter font family for modern typography
- **Pure CSS/JavaScript**: No external frontend frameworks, using vanilla web technologies

## Environment Configuration
- **GEMINI_API_KEY**: Required environment variable for Google Gemini API access
- **SESSION_SECRET**: Flask session encryption key (defaults to development key)

## Future Database Considerations
The current implementation stores conversations in memory, but the architecture is designed to easily migrate to a database solution like PostgreSQL for persistent conversation history and user management in production environments.