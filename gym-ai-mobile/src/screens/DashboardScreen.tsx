import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../services/AuthContext';
import { nutritionService, workoutService, metricService, coachService } from '../services/api';
import { Workout } from '../types';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Queries
  const { data: todayMeals = [], isLoading: loadingNutrition } = useQuery({
    queryKey: ['nutritionToday', todayStr],
    queryFn: () => nutritionService.getLogs(todayStr),
  });

  const { data: metrics = [], isLoading: loadingMetrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: metricService.getMetrics,
  });

  const { data: prs = [], isLoading: loadingPRs } = useQuery({
    queryKey: ['prs'],
    queryFn: workoutService.getPRs,
  });

  const { data: latestInsight, isLoading: loadingInsight } = useQuery({
    queryKey: ['latestInsight'],
    queryFn: coachService.getInsights,
    retry: false, // Don't block dashboard if no insights exist yet
  });

  const { data: workouts = [], isLoading: loadingWorkouts } = useQuery({
    queryKey: ['workouts'],
    queryFn: workoutService.getWorkouts,
  });

  // Mutation to request new coach advice
  const coachMutation = useMutation({
    mutationFn: coachService.getInsights,
    onSuccess: (data) => {
      queryClient.setQueryData(['latestInsight'], data);
      setAnalyzing(false);
    },
    onError: (err: any) => {
      setAnalysisError('Could not generate advice. Log more data first.');
      setAnalyzing(false);
    }
  });

  const triggerCoachAnalysis = () => {
    setAnalyzing(true);
    setAnalysisError('');
    coachMutation.mutate();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['nutritionToday', todayStr] }),
      queryClient.invalidateQueries({ queryKey: ['metrics'] }),
      queryClient.invalidateQueries({ queryKey: ['prs'] }),
      queryClient.invalidateQueries({ queryKey: ['latestInsight'] }),
      queryClient.invalidateQueries({ queryKey: ['workouts'] }),
    ]);
    setRefreshing(false);
  };

  // Calculations
  const loggedCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const loggedProtein = todayMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const loggedCarbs = todayMeals.reduce((sum, meal) => sum + meal.carbs, 0);
  const loggedFat = todayMeals.reduce((sum, meal) => sum + meal.fat, 0);

  // Targets (default)
  const targetCalories = 2400;
  const targetProtein = 150;
  const targetCarbs = 250;
  const targetFat = 80;

  const latestWeight = metrics.length > 0 ? metrics[metrics.length - 1].weight : null;

  // Streak Calculation
  const calculateStreak = (workoutsList: Workout[]) => {
    if (!workoutsList || workoutsList.length === 0) return 0;

    // Extract unique UTC dates (YYYY-MM-DD) of workouts
    const workoutDates = new Set<string>();
    workoutsList.forEach(w => {
      if (w.date) {
        const dateStr = w.date.split('T')[0];
        workoutDates.add(dateStr);
      }
    });

    // Today in UTC
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Yesterday in UTC
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If the user did not workout today or yesterday, streak is 0
    if (!workoutDates.has(todayStr) && !workoutDates.has(yesterdayStr)) {
      return 0;
    }

    let currentStreak = 0;
    // Start from whichever day (today or yesterday) has a workout logged
    let currentDate = workoutDates.has(todayStr) 
      ? new Date(today.getTime()) 
      : new Date(yesterday.getTime());

    // Count backwards day-by-day in UTC
    while (true) {
      const checkStr = currentDate.toISOString().split('T')[0];
      if (workoutDates.has(checkStr)) {
        currentStreak++;
        // Subtract 1 day in UTC
        currentDate.setUTCDate(currentDate.getUTCDate() - 1);
      } else {
        break;
      }
    }

    return currentStreak;
  };

  const streak = calculateStreak(workouts);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'Athlete'}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color="#FF2E93" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#00F5FF" />
        }
      >
        {/* Daily Macros Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Nutrition Summary</Text>
          <View style={styles.calorieContainer}>
            <View style={styles.calorieTextContainer}>
              <Text style={styles.calorieLogged}>{Math.round(loggedCalories)}</Text>
              <Text style={styles.calorieTarget}>/ {targetCalories} kcal</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${Math.min(100, (loggedCalories / targetCalories) * 100)}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.macroRow}>
            {/* Protein */}
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{Math.round(loggedProtein)}g / {targetProtein}g</Text>
              <View style={styles.miniBarBg}>
                <View 
                  style={[
                    styles.miniBarFill, 
                    { backgroundColor: '#00F5FF', width: `${Math.min(100, (loggedProtein / targetProtein) * 100)}%` }
                  ]} 
                />
              </View>
            </View>

            {/* Carbs */}
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{Math.round(loggedCarbs)}g / {targetCarbs}g</Text>
              <View style={styles.miniBarBg}>
                <View 
                  style={[
                    styles.miniBarFill, 
                    { backgroundColor: '#FF9900', width: `${Math.min(100, (loggedCarbs / targetCarbs) * 100)}%` }
                  ]} 
                />
              </View>
            </View>

            {/* Fat */}
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{Math.round(loggedFat)}g / {targetFat}g</Text>
              <View style={styles.miniBarBg}>
                <View 
                  style={[
                    styles.miniBarFill, 
                    { backgroundColor: '#FF2E93', width: `${Math.min(100, (loggedFat / targetFat) * 100)}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* Highlights Row (Streak & Weight) */}
        <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.rowAlign}>
              <Ionicons name="flame" size={24} color="#FF9900" />
              <Text style={styles.halfCardTitle}>Streak</Text>
            </View>
            <Text style={styles.halfCardVal}>
              {loadingWorkouts ? '...' : (streak === 1 ? '1 Day' : `${streak} Days`)}
            </Text>
            <Text style={styles.halfCardSub}>
              {streak > 0 ? 'Keep it up!' : 'Start a streak today!'}
            </Text>
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.rowAlign}>
              <Ionicons name="scale-outline" size={24} color="#00F5FF" />
              <Text style={styles.halfCardTitle}>Weight</Text>
            </View>
            <Text style={styles.halfCardVal}>
              {latestWeight ? `${latestWeight} kg` : '--'}
            </Text>
            <Text style={styles.halfCardSub}>
              {metrics.length > 1 ? 'Updated recently' : 'No logs yet'}
            </Text>
          </View>
        </View>

        {/* AI Coach Insights */}
        <View style={[styles.card, styles.coachCard]}>
          <View style={styles.coachHeader}>
            <View style={styles.rowAlign}>
              <Ionicons name="bulb-outline" size={24} color="#00F5FF" />
              <Text style={styles.coachTitle}>AI Coach Insights</Text>
            </View>
            <TouchableOpacity 
              style={styles.coachRefreshButton} 
              onPress={triggerCoachAnalysis}
              disabled={analyzing}
            >
              {analyzing ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.coachRefreshText}>Run Coach</Text>
              )}
            </TouchableOpacity>
          </View>

          {analysisError ? <Text style={styles.errorText}>{analysisError}</Text> : null}

          {loadingInsight ? (
            <ActivityIndicator size="small" color="#00F5FF" style={{ marginVertical: 20 }} />
          ) : latestInsight ? (
            <View style={styles.insightContentContainer}>
              <Text style={styles.insightText}>{latestInsight.content}</Text>
            </View>
          ) : (
            <View style={styles.noInsightContainer}>
              <Text style={styles.noInsightText}>
                No recommendations generated yet. Log some workouts, nutrition, and weight metrics, then click "Run Coach" for custom advice.
              </Text>
            </View>
          )}
        </View>

        {/* Personal Records Highlight */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⭐ Personal Records</Text>
          {loadingPRs ? (
            <ActivityIndicator size="small" color="#00F5FF" />
          ) : prs.length > 0 ? (
            prs.slice(0, 3).map((pr, index) => (
              <View key={index} style={styles.prRow}>
                <Text style={styles.prName}>{pr.exercise_name}</Text>
                <View style={styles.prValues}>
                  <Text style={styles.prWeight}>{pr.max_weight} kg</Text>
                  <Text style={styles.prVolume}>Vol: {Math.round(pr.max_volume)} kg</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noPrText}>No personal records logged yet. Complete a workout!</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#2C2C2C',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  calorieContainer: {
    marginBottom: 20,
  },
  calorieTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  calorieLogged: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  calorieTarget: {
    fontSize: 14,
    color: '#A0A0A0',
    marginLeft: 6,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#121212',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00F5FF',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  macroLabel: {
    fontSize: 11,
    color: '#A0A0A0',
    fontWeight: '600',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  miniBarBg: {
    height: 4,
    backgroundColor: '#121212',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfCard: {
    flex: 0.48,
    marginBottom: 0,
    padding: 16,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  halfCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0A0A0',
    marginLeft: 6,
  },
  halfCardVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  halfCardSub: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 2,
  },
  coachCard: {
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  coachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  coachTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  coachRefreshButton: {
    backgroundColor: '#00F5FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  coachRefreshText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  insightContentContainer: {
    marginTop: 4,
  },
  insightText: {
    color: '#E0E0E0',
    fontSize: 13,
    lineHeight: 20,
  },
  noInsightContainer: {
    alignItems: 'center',
    padding: 12,
  },
  noInsightText: {
    color: '#A0A0A0',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorText: {
    color: '#FF2E93',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#2C2C2C',
  },
  prName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  prValues: {
    alignItems: 'flex-end',
  },
  prWeight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00F5FF',
  },
  prVolume: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 2,
  },
  noPrText: {
    color: '#A0A0A0',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
  },
});
