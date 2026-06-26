import axios from 'axios';
import { 
  User, Exercise, Workout, NutritionLog, BodyMetric, AIInsight, ScannedFoodResult 
} from '../types';

// Dynamically resolve the backend URL depending on the browser environment
let API_BASE_URL = 'http://192.168.1.33:8000';

if (typeof window !== 'undefined') {
  const { hostname, port, origin } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (port === '8081') {
      API_BASE_URL = 'http://localhost:8000';
    } else {
      API_BASE_URL = origin;
    }
  } else {
    // Dynamic container environments (e.g. Gitpod, Codespaces, Gemini Previews)
    if (hostname.startsWith('8081-')) {
      API_BASE_URL = origin.replace('8081-', '8000-');
    } else if (port === '8081') {
      API_BASE_URL = origin.replace(':8081', ':8000');
    } else {
      API_BASE_URL = origin;
    }
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
});


// Sets or removes the authorization header
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const authService = {
  syncUser: async (email: string, name: string, firebaseUid: string): Promise<User> => {
    const res = await api.post('/api/auth/sync', {
      email,
      name,
      firebase_uid: firebaseUid,
    });
    return res.data;
  },
};

export const workoutService = {
  getExercises: async (): Promise<Exercise[]> => {
    const res = await api.get('/api/workouts/exercises');
    return res.data;
  },
  createCustomExercise: async (name: string, muscleGroup: string, equipment: string): Promise<Exercise> => {
    const res = await api.post('/api/workouts/exercises', {
      name,
      muscle_group: muscleGroup,
      equipment,
    });
    return res.data;
  },
  getWorkouts: async (): Promise<Workout[]> => {
    const res = await api.get('/api/workouts');
    return res.data;
  },
  createWorkout: async (workoutData: {
    name: string;
    duration: number;
    date?: string;
    logs: { exercise_id: number; set_number: number; reps: number; weight: number }[];
  }): Promise<Workout> => {
    const res = await api.post('/api/workouts', workoutData);
    return res.data;
  },
  getPRs: async (): Promise<any[]> => {
    const res = await api.get('/api/workouts/prs');
    return res.data;
  },
};

export const nutritionService = {
  getLogs: async (date?: string): Promise<NutritionLog[]> => {
    const url = date ? `/api/nutrition?date=${date}` : '/api/nutrition';
    const res = await api.get(url);
    return res.data;
  },
  logMeal: async (mealData: {
    food_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: string;
    date?: string;
  }): Promise<NutritionLog> => {
    const res = await api.post('/api/nutrition', mealData);
    return res.data;
  },
  scanMealImage: async (imageUri: string, description?: string): Promise<ScannedFoodResult> => {
    const formData = new FormData();
    if (description) {
      formData.append('description', description);
    }
    
    // In React Native / Web environment, construct a file object
    if (imageUri) {
      // Check if web environment
      if (imageUri.startsWith('data:') || imageUri.startsWith('blob:') || typeof window !== 'undefined') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('file', blob, 'meal.jpg');
      } else {
        // React Native file uploading format
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'meal.jpg',
        } as any);
      }
    }
    
    const res = await api.post('/api/nutrition/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  scanMealDescription: async (description: string): Promise<ScannedFoodResult> => {
    const formData = new FormData();
    formData.append('description', description);
    
    const res = await api.post('/api/nutrition/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

export const metricService = {
  getMetrics: async (): Promise<BodyMetric[]> => {
    const res = await api.get('/api/metrics');
    return res.data;
  },
  logMetric: async (metricData: {
    weight: number;
    body_fat?: number;
    waist?: number;
    date?: string;
  }): Promise<BodyMetric> => {
    const res = await api.post('/api/metrics', metricData);
    return res.data;
  },
};

export const coachService = {
  getInsights: async (): Promise<AIInsight> => {
    const res = await api.get('/api/coach/insights');
    return res.data;
  },
  chatWithCoach: async (message: string, history: { role: string; content: string }[]): Promise<string> => {
    const res = await api.post('/api/coach/chat', {
      message,
      history,
    });
    return res.data.response;
  },
};

