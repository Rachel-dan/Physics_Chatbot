# chatbot.py
import google.generativeai as genai
import os

# --- Configuration ---
# IMPORTANT: Replace "YOUR_API_KEY" with the actual key you got from Google AI Studio.
# For better security, it's recommended to use environment variables, but for this project, direct replacement is fine.
API_KEY = "AIzaSyBJfSM9YkZ3jtZSqjfhfj9uLdePCGLG_Ao" 

# Configure the generative AI model
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('models/gemini-pro-latest')

# --- Main Chatbot Logic ---
def get_ai_response(user_query):
    """
    Sends the user's query to the Gemini API and gets a response.
    """
    try:
        # We add instructions to the user's query to guide the AI's response.
        prompt = f"You are a helpful physics tutor. Explain the following concept in a clear and simple way: {user_query}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        # Handle potential errors, e.g., if the API key is invalid
        print(f"An error occurred: {e}")
        return "Sorry, I'm having trouble connecting to my brain right now. Please check the API key."

def main():
    """
    This is the main function that runs our chatbot loop.
    """
    print("Hello! I am your AI-powered Physics Chatbot. Ask me any physics question or type 'quit' to exit.")

    while True:
        user_input = input("You: ")

        if user_input.lower() == 'quit':
            print("Goodbye!")
            break

        # Get the AI-generated response
        response = get_ai_response(user_input)
        print(f"Chatbot: {response}")

# This line makes the script runnable
if __name__ == "__main__":
    main()