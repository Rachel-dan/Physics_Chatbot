# check_models.py
import google.generativeai as genai

# --- Configuration ---
# IMPORTANT: Replace "YOUR_API_KEY" with your actual key.
API_KEY = "AIzaSyBJfSM9YkZ3jtZSqjfhfj9uLdePCGLG_Ao"

# Configure the generative AI
genai.configure(api_key=API_KEY)

# --- List Models ---
print("Finding available models that can generate text...")
for m in genai.list_models():
    # Check if the 'generateContent' method is supported by the model
    if 'generateContent' in m.supported_generation_methods:
        print(f"Found one! Use this name: {m.name}")