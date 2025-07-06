
# 💧 HydraTrack

**Your personal hydration assistant.**
HydraTrack is a smart AI-powered water intake app that creates personalized hydration plans based on your age, weight, health conditions, and local weather. Stay healthy and hydrated with tailored schedules, reminders, and progress tracking.

## Schema

```
-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the profiles table
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  age INT,
  weight FLOAT,
  gender TEXT,
  activity_level TEXT,
  health_conditions TEXT
);

-- Create the hydration_plans table
CREATE TABLE hydration_plans (
  user_id UUID REFERENCES profiles(user_id),
  date DATE,
  total_intake_ml INT,
  schedule JSONB,
  suggestions TEXT,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

-- Create the water_logs table
CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  amount INT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create RLS (Row Level Security) policies
-- This ensures users can only access their own data

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for hydration_plans table
CREATE POLICY "Users can view their own hydration plans"
  ON hydration_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hydration plans"
  ON hydration_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hydration plans"
  ON hydration_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for water_logs table
CREATE POLICY "Users can view their own water logs"
  ON water_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water logs"
  ON water_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water logs"
  ON water_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water logs"
  ON water_logs FOR DELETE
  USING (auth.uid() = user_id);
```

##  Download the App

Test the app directly on your Android device:


https://expo.dev/accounts/spandanm110/projects/hydratrack/builds/56011da3-420b-443c-ae4f-9df49bc54387

### 🔗 [Download APK](https://expo.dev/accounts/spandanm110/projects/hydratrack/builds/56011da3-420b-443c-ae4f-9df49bc54387)

> *(The APK is available under the **Releases** section of this repository.)*

#### 📥 Installation Instructions:

1. Download the `.apk` file from the link above.
2. Enable **"Install from unknown sources"** in your phone settings.
3. Tap the APK to install HydraTrack.
4. Open the app and start your hydration journey!

---

## Features

* Secure signup/login using Supabase
* Profile setup with age, weight, health, activity level
* Auto weather fetch based on your GPS location (via OpenWeather API)
* AI-generated hydration plans using **Gemini 1.5 model**
* Smart water reminders scheduled via Expo Notifications
* Quick water logging (250ml / 500ml / custom)
* Real-time progress tracker
* Weekly and daily consumption history
* Personalized hydration tips based on weather and health

---

## Tech Stack

| Layer         | Technology                  |
| ------------- | --------------------------- |
| Framework     | React Native (Expo)         |
| Backend       | Supabase (Auth + DB)        |
| Weather API   | OpenWeatherMap API          |
| AI Engine     | Google Gemini 1.5b Flash |
| Notifications | Expo Notifications          |
| Location      | Expo Location API           |

---
##  App Screenshots

| Login | Dashboard | Hydration Tip | Progress | Profile |
|:-----:|:---------:|:-------------:|:--------:|:-------:|
| ![Login](https://github.com/user-attachments/assets/1fa981e9-2aa0-4701-9d11-c74f110abd65) | ![Dashboard](https://github.com/user-attachments/assets/187e2b5e-9b49-4302-ab79-203b320aeda8) | ![Tip](https://github.com/user-attachments/assets/c89356b3-5638-4cb2-bc07-b95e2301cdd3) | ![Progress](https://github.com/user-attachments/assets/20bffc00-a8fc-4980-b8a6-354ebe614f9d) | ![Profile](https://github.com/user-attachments/assets/69f05c52-4128-4c99-90b5-6379dd6e9e5a) |


## Getting Started (Developer Setup)

### 1. Clone the repository

```bash
git clone https://github.com/SpandanM110/HydraTrack.git
cd HydraTrack
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add `.env` file

Create a `.env` file in the root with your own keys:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
OPENWEATHER_API_KEY=your_openweather_key
GEMINI_API_KEY=your_gemini_key
```


### 4. Start the app

```bash
npx expo start
```

Scan the QR code with **Expo Go** or run on emulator.

---


## 📌 Notes

* Gemini API is triggered **once per user per day** after profile setup and weather fetch.
* User data, hydration plan, and logs are securely stored in **Supabase**.
* Weather is retrieved based on real-time **GPS location** using Expo’s Location API.

---


## 🙋‍♂️ Developed By

**Spandan Mukherjee**
🔗 [LinkedIn](https://linkedin.com/in/spandanm110)


---

