import os
import json
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

logger = logging.getLogger(__name__)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    logger.info("Gemini API configured successfully.")
else:
    logger.warning("GEMINI_API_KEY not found in environment. AI features will run in simulated mode.")

def analyze_food(
    image_bytes: Optional[bytes] = None,
    mime_type: Optional[str] = None,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyzes food image bytes and/or description using Gemini.
    Falls back to a realistic mock analysis if the Gemini API key is missing or calls fail.
    """
    if not api_key:
        return get_simulated_food_analysis(description)

    try:
        # Using the standard gemini-2.5-flash model
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        contents = []
        if image_bytes:
            contents.append({
                "mime_type": mime_type or "image/jpeg",
                "data": image_bytes
            })
            
        prompt = """
        Analyze this food image or description. Determine the food items present, and estimate the total nutritional values.
        Respond ONLY with a JSON object in this format:
        {
          "food_name": "Description of the food items found",
          "calories": float,
          "protein": float,
          "carbs": float,
          "fat": float,
          "quantity": "Estimated weight in grams or portion size"
        }
        Do not include markdown or backticks (e.g. ```json). Raw JSON only.
        """
        
        if description:
            prompt += f"\nUser Context / Description: {description}"
            
        contents.append(prompt)
        
        # Configure structured JSON output
        generation_config = {
            "response_mime_type": "application/json"
        }
        
        response = model.generate_content(
            contents,
            generation_config=generation_config
        )
        
        data = json.loads(response.text.strip())
        return data
        
    except Exception as e:
        logger.error(f"Error calling Gemini: {e}")
        return get_simulated_food_analysis(description or "food")

def generate_coaching_advice(summary: str) -> str:
    """
    Generates tailored coaching recommendations based on training logs, nutrition, and weight trends.
    """
    if not api_key:
        return get_simulated_coaching_advice(summary)
        
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""
        You are GymAI Coach, an elite personal trainer, sports nutritionist, and strength coach.
        Analyze the following user progress summary and provide clear, professional, actionable recommendations.
        Format your response using Markdown. Keep it structured, positive, and concise (under 200 words).
        
        User Data Summary:
        {summary}
        """
        
        response = model.generate_content(prompt)
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Error calling Gemini for coaching: {e}")
        return get_simulated_coaching_advice(summary)

def get_simulated_food_analysis(description: Optional[str] = None) -> Dict[str, Any]:
    """
    Fallback food analyzer for development / simulation mode.
    """
    desc = (description or "").lower()
    if "chicken" in desc or "breast" in desc or "rice" in desc:
        return {
            "food_name": "Grilled Chicken Breast with White Rice & Broccoli (Simulated)",
            "calories": 520.0,
            "protein": 42.0,
            "carbs": 65.0,
            "fat": 9.0,
            "quantity": "1 plate (approx 400g)"
        }
    elif "egg" in desc or "eggs" in desc or "toast" in desc:
        return {
            "food_name": "Scrambled Eggs (3) with Whole Wheat Toast (2 slices) (Simulated)",
            "calories": 385.0,
            "protein": 24.0,
            "carbs": 28.0,
            "fat": 17.5,
            "quantity": "1 serving (approx 250g)"
        }
    elif "shake" in desc or "protein" in desc or "whey" in desc:
        return {
            "food_name": "Whey Protein Shake with Banana (Simulated)",
            "calories": 310.0,
            "protein": 30.0,
            "carbs": 35.0,
            "fat": 4.5,
            "quantity": "1 glass (400ml)"
        }
    elif "salad" in desc:
        return {
            "food_name": "Greek Salad with Olive Oil and Feta (Simulated)",
            "calories": 280.0,
            "protein": 6.0,
            "carbs": 12.0,
            "fat": 24.0,
            "quantity": "1 bowl (approx 300g)"
        }
    elif "pizza" in desc:
        return {
            "food_name": "Pepperoni Pizza Slice (2 slices) (Simulated)",
            "calories": 580.0,
            "protein": 22.0,
            "carbs": 64.0,
            "fat": 26.0,
            "quantity": "2 standard slices (approx 200g)"
        }
    elif "burger" in desc or "fries" in desc:
        return {
            "food_name": "Beef Burger with French Fries (Simulated)",
            "calories": 850.0,
            "protein": 35.0,
            "carbs": 88.0,
            "fat": 40.0,
            "quantity": "1 burger and fries combo"
        }
    else:
        # Default healthy fallback
        item = description if description else "Mixed Healthy Meal"
        return {
            "food_name": f"{item} (Simulated)",
            "calories": 450.0,
            "protein": 25.0,
            "carbs": 50.0,
            "fat": 15.0,
            "quantity": "1 typical serving"
        }

def get_simulated_coaching_advice(summary: str) -> str:
    """
    Fallback coaching advice for development / simulation mode.
    """
    summary_lower = summary.lower()
    
    advice = "### 🧠 GymAI Coach Recommendations (Simulated)\n\n"
    
    # Analyze protein
    if "protein" in summary_lower and ("low" in summary_lower or "under" in summary_lower or "below" in summary_lower or "g/day" in summary_lower):
        advice += "* **Target Protein Intake:** Your protein logs show room for improvement. Aim for **1.6g to 2.2g of protein per kg of body weight** to support muscle repair. Consider adding eggs, chicken, Greek yogurt, or whey protein.\n\n"
    else:
        advice += "* **Nutrition Success:** You are doing well meeting your macro targets. Consistency is key here!\n\n"
        
    # Analyze workout stalls
    if "stall" in summary_lower or "stuck" in summary_lower or "no improvement" in summary_lower or "weeks" in summary_lower:
        advice += "* **Break Strength Plateaus:** It looks like progression has slowed down on compound lifts (like Bench Press or Squat). Consider implementing a **deload week** (reduce weights by 20% but maintain form) or switch up rep schemes (e.g. from 3x8 to 5x5) to recruit new muscle fibers.\n\n"
    else:
        advice += "* **Training Progression:** Your workouts show great progress! Keep pushing using progressive overload—either add a rep or increase the weight by 2.5kg once you can perform all sets at the top of your target rep range.\n\n"
        
    # Analyze weight trends
    if "weight" in summary_lower:
        if "gain" in summary_lower or "up" in summary_lower or "increase" in summary_lower:
            advice += "* **Body Weight Trend:** Your weight is trending upwards. If you are in a building phase, aim for a slow gain of **0.25kg - 0.5kg per week** to maximize muscle gain and minimize fat gain.\n\n"
        elif "lose" in summary_lower or "down" in summary_lower or "decrease" in summary_lower:
            advice += "* **Body Weight Trend:** Your weight is trending downwards. Good job on the cutting phase! Aim for a loss rate of **0.5% - 1% of body weight per week** to ensure you preserve lean muscle tissue.\n\n"
        else:
            advice += "* **Body Weight Trend:** Your weight is stable. This is perfect for a body recomposition phase. Make sure your training is intense to build muscle while losing fat.\n\n"
            
    advice += "* **Recovery Tip:** Keep sleep consistency high. 7-8 hours of sleep per night is when the real muscle growth and nervous system recovery happens!"
    return advice

def chat_with_coach(message: str, history: list, context: str) -> str:
    """
    Sends a message to the AI coach, along with conversation history and user statistics context.
    """
    if not api_key:
        return get_simulated_chat_response(message, context)
        
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt_parts = [
            "You are GymAI Coach, an elite personal trainer and sports nutritionist.",
            "Here is the user's progress context:",
            context,
            "\nConversation history:"
        ]
        
        for msg in history:
            role_name = "User" if msg["role"] == "user" else "Coach"
            prompt_parts.append(f"{role_name}: {msg['content']}")
            
        prompt_parts.append(f"User: {message}")
        prompt_parts.append("Coach:")
        
        prompt = "\n".join(prompt_parts)
        response = model.generate_content(prompt)
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Error in chat_with_coach: {e}")
        return get_simulated_chat_response(message, context)

def get_simulated_chat_response(message: str, context: str) -> str:
    """
    Simulated responses for user queries if Gemini API is disabled.
    """
    msg = message.lower()
    
    if "protein" in msg or "eat" in msg or "diet" in msg or "nutrition" in msg or "cal" in msg:
        return "Based on your nutrition data, I recommend aiming for 1.6g to 2.2g of protein per kg of body weight. Try dividing your protein intake into 3-4 meals containing 30-40g each to maximize muscle protein synthesis. What does your current protein intake look like today?"
        
    if "bench" in msg or "squat" in msg or "deadlift" in msg or "stall" in msg or "stuck" in msg or "plateau" in msg or "lift" in msg:
        return "When compound lifts stall, it's usually due to recovery or progression structure. Try implementing a deload week where you drop the weight by 20% but keep volume high to let your nervous system recover. Or switch from 3 sets of 8 to 5 sets of 5 reps to build raw strength. Let me know which lift is giving you trouble!"
        
    if "weight" in msg or "fat" in msg or "cut" in msg or "bulk" in msg:
        return "To optimize your weight, align your calorie intake with your goals. For muscle building (bulk), maintain a surplus of +250 to +500 kcal daily. For fat loss (cut), maintain a deficit of -350 to -500 kcal. Make sure your training remains heavy to retain muscle mass during a cut. What is your primary body goal right now?"
        
    return "Great question! Consistent tracking of your sets, reps, weight, and meals is the foundation of progress. Keep logging daily. Is there a specific exercise, diet query, or weight target you'd like us to focus on next?"

