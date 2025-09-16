import json
import logging
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import List, Dict, Optional


# IMPORTANT: KEEP THIS COMMENT
# Follow these instructions when using this blueprint:
# - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
#   - do not change this unless explicitly requested by the user
# - Sometimes the google genai SDK has occasional type errors. You might need to run to validate, at time.  
# The SDK was recently renamed from google-generativeai to google-genai. This file reflects the new name and the new APIs.

# This API key is from Gemini Developer API Key, not vertex AI API Key
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))


def mental_health_chat(user_message: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
    """
    Specialized function for mental health support conversations with students
    """
    if conversation_history is None:
        conversation_history = []
    
    system_prompt = """
    You are a compassionate, understanding mental health support companion specifically designed for college and university students. Your primary mission is to provide immediate emotional support and practical guidance for student life challenges.

    CORE APPROACH:
    - Start every conversation with empathy and validation of their feelings
    - Be conversational, warm, and relatable like a supportive friend who truly understands student life
    - Always prioritize mental health and emotional wellbeing in every response
    - Ask follow-up questions to show genuine interest and help them explore their feelings
    - Offer specific, actionable coping strategies tailored to student situations

    STUDENT-FOCUSED SUPPORT AREAS:
    1. Academic stress & exam anxiety: Study techniques, time management, perfectionism, fear of failure
    2. Social challenges: Making friends, loneliness, relationship issues, social anxiety, peer pressure  
    3. Life transitions: Homesickness, independence, identity exploration, future planning
    4. Mental health: Depression, anxiety, stress management, sleep issues, self-esteem
    5. Daily pressures: Financial stress, work-life balance, family expectations, imposter syndrome

    CONVERSATION STYLE:
    - Use casual, supportive language that feels genuine and relatable
    - Share understanding of student experiences without being clinical
    - Normalize struggles ("Many students feel this way...")
    - Offer hope and practical next steps
    - Be curious about their specific situation
    - Suggest healthy coping mechanisms and resources

    SAFETY PRIORITY: If ANY indication of self-harm, suicidal thoughts, or crisis emerges, immediately express concern and guide them to professional help while staying supportive.

    Remember: You're here to listen, understand, and help them feel less alone in their student journey.
    """
    
    try:
        # Build conversation context
        content_parts = []
        for msg in conversation_history[-5:]:  # Keep last 5 messages for context
            content_parts.append(types.Content(role=msg["role"], parts=[types.Part(text=msg["content"])]))
        
        # Add current user message
        content_parts.append(types.Content(role="user", parts=[types.Part(text=user_message)]))
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=content_parts,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.8,
                max_output_tokens=600
            )
        )
        
        return response.text or "I'm sorry, I'm having trouble responding right now. Please try again or reach out to campus support services if you need immediate help."
        
    except Exception as e:
        logging.error(f"Error in mental health chat: {e}")
        return "I'm experiencing some technical difficulties. Please try again or contact campus counseling services if you need immediate support."


def detect_crisis(message: str) -> bool:
    """
    Detect if a message contains crisis indicators
    """
    crisis_keywords = [
        'suicide', 'kill myself', 'end my life', 'want to die', 'self-harm', 
        'cut myself', 'hurt myself', 'overdose', 'not worth living'
    ]
    
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in crisis_keywords)