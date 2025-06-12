import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '@env';

if (!GEMINI_API_KEY) {
  throw new Error('Gemini API key is missing');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface UserProfile {
  age: number;
  weight: number;
  gender: string;
  activity_level: string;
  health_conditions?: string;
}

export interface HydrationScheduleItem {
  time: string;
  amount: number;
  description?: string;
}

export interface HydrationPlan {
  total_intake_ml: number;
  schedule: HydrationScheduleItem[];
  suggestions: string;
}

export const generateHydrationPlan = async (
  profile: UserProfile, 
  weather: { temperature: number; humidity: number; description: string; city: string }
): Promise<HydrationPlan> => {
  try {
    const prompt = `
Create a personalized hydration plan for a person with the following details:

Personal Information:
- Age: ${profile.age} years
- Weight: ${profile.weight} kg
- Gender: ${profile.gender}
- Activity Level: ${profile.activity_level}
- Health Conditions: ${profile.health_conditions || "None"}

Current Weather Conditions:
- Location: ${weather.city}
- Temperature: ${weather.temperature}°C
- Humidity: ${weather.humidity}%
- Conditions: ${weather.description}

Please provide a JSON response with the following structure:
{
  "total_intake_ml": number (total daily water intake in milliliters),
  "schedule": [
    {
      "time": "HH:MM" (24-hour format),
      "amount": number (amount in milliliters),
      "description": "brief description of why this timing/amount"
    }
  ],
  "suggestions": "personalized hydration tips and advice based on the profile and weather"
}

Consider the following factors:
1. Base water needs based on weight (30-35ml per kg body weight)
2. Activity level adjustments
3. Weather conditions (hot weather = more water, high humidity = more water)
4. Age-related considerations
5. Health conditions that might affect hydration needs
6. Optimal timing throughout the day
7. Spread intake evenly to avoid overloading kidneys

Provide 6-8 scheduled water intake times throughout the day from 7 AM to 9 PM.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/{[\s\S]*?}/);
                      
    if (!jsonMatch) {
      console.warn('Could not parse AI response, using fallback');
      return generateFallbackPlan(profile, weather);
    }
    
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsedPlan = JSON.parse(jsonStr);
    
    // Validate the parsed plan
    if (!parsedPlan.total_intake_ml || !Array.isArray(parsedPlan.schedule)) {
      console.warn('Invalid AI response structure, using fallback');
      return generateFallbackPlan(profile, weather);
    }
    
    return parsedPlan;
  } catch (error) {
    console.error('Error generating hydration plan:', error);
    return generateFallbackPlan(profile, weather);
  }
};

const generateFallbackPlan = (
  profile: UserProfile, 
  weather: { temperature: number; humidity: number; description: string }
): HydrationPlan => {
  // Calculate base water needs (30ml per kg body weight)
  let baseIntake = profile.weight * 30;
  
  // Adjust for activity level
  const activityMultipliers = {
    sedentary: 1.0,
    light: 1.1,
    moderate: 1.2,
    active: 1.3,
    very_active: 1.4,
  };
  
  const multiplier = activityMultipliers[profile.activity_level as keyof typeof activityMultipliers] || 1.2;
  baseIntake *= multiplier;
  
  // Adjust for weather
  if (weather.temperature > 25) {
    baseIntake *= 1.1;
  }
  if (weather.temperature > 30) {
    baseIntake *= 1.2;
  }
  if (weather.humidity > 70) {
    baseIntake *= 1.05;
  }
  
  const totalIntake = Math.round(baseIntake);
  
  // Create schedule
  const schedule: HydrationScheduleItem[] = [
    { time: "07:00", amount: Math.round(totalIntake * 0.15), description: "Morning hydration boost" },
    { time: "09:00", amount: Math.round(totalIntake * 0.12), description: "Mid-morning intake" },
    { time: "11:30", amount: Math.round(totalIntake * 0.12), description: "Pre-lunch hydration" },
    { time: "14:00", amount: Math.round(totalIntake * 0.15), description: "Afternoon energy boost" },
    { time: "16:30", amount: Math.round(totalIntake * 0.12), description: "Late afternoon intake" },
    { time: "18:30", amount: Math.round(totalIntake * 0.12), description: "Evening hydration" },
    { time: "20:30", amount: Math.round(totalIntake * 0.10), description: "Light evening intake" },
  ];
  
  return {
    total_intake_ml: totalIntake,
    schedule,
    suggestions: `Stay hydrated throughout the day. Given the current weather (${weather.temperature}°C), make sure to drink regularly. Your ${profile.activity_level} activity level requires consistent hydration.`,
  };
};