import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, 
  TouchableOpacity, ActivityIndicator, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { metricService } from '../services/api';

export default function MetricsScreen() {
  const queryClient = useQueryClient();

  // Log Form State
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [waist, setWaist] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Queries
  const { data: metrics = [], isLoading: loadingMetrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: metricService.getMetrics,
  });

  // Mutations
  const logMetricMutation = useMutation({
    mutationFn: metricService.logMetric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['latestInsight'] });
      setWeight('');
      setBodyFat('');
      setWaist('');
      setSuccess(true);
      setError('');
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: () => {
      setError('Failed to log metric. Check values.');
    }
  });

  const handleLogMetric = () => {
    if (!weight) {
      setError('Weight is required.');
      return;
    }
    setError('');
    logMetricMutation.mutate({
      weight: parseFloat(weight),
      body_fat: bodyFat ? parseFloat(bodyFat) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
    });
  };

  // Chart Logic (using last 6 weight entries)
  const chartData = metrics.slice(-6);
  const weights = chartData.map(m => m.weight);
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const weightDiff = maxWeight - minWeight;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Body Metrics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Weight Trend Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weight Progress Chart</Text>
          {loadingMetrics ? (
            <ActivityIndicator color="#00F5FF" style={{ marginVertical: 40 }} />
          ) : chartData.length >= 2 ? (
            <View style={styles.chartContainer}>
              <View style={styles.chartYAxis}>
                <Text style={styles.yAxisText}>{maxWeight.toFixed(1)} kg</Text>
                <Text style={styles.yAxisText}>{((maxWeight + minWeight) / 2).toFixed(1)} kg</Text>
                <Text style={styles.yAxisText}>{minWeight.toFixed(1)} kg</Text>
              </View>

              <View style={styles.barsContainer}>
                {chartData.map((item, index) => {
                  // Calculate height proportional to weight between min and max
                  const heightPercent = weightDiff > 0 
                    ? ((item.weight - minWeight) / weightDiff) * 60 + 25 
                    : 50;

                  return (
                    <View key={item.id} style={styles.barCol}>
                      <View style={styles.barWrapper}>
                        <Text style={styles.barValText}>{item.weight.toFixed(1)}</Text>
                        <View style={[styles.bar, { height: `${heightPercent}%` }]} />
                      </View>
                      <Text style={styles.barLabel}>
                        {new Date(item.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.noChartContainer}>
              <Ionicons name="trending-up-outline" size={32} color="#444" />
              <Text style={styles.noChartText}>Log at least 2 weight entries to see your progress chart.</Text>
            </View>
          )}
        </View>

        {/* Log Metric Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Log Today's Metrics</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>✓ Metric logged successfully!</Text> : null}

          <Text style={styles.label}>Current Weight (kg)</Text>
          <TextInput 
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="e.g. 78.5"
            placeholderTextColor="#666"
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Body Fat % (Optional)</Text>
              <TextInput 
                style={styles.input}
                value={bodyFat}
                onChangeText={setBodyFat}
                keyboardType="numeric"
                placeholder="e.g. 15.4"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Waist (cm) (Optional)</Text>
              <TextInput 
                style={styles.input}
                value={waist}
                onChangeText={setWaist}
                keyboardType="numeric"
                placeholder="e.g. 84"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleLogMetric}
            disabled={logMetricMutation.isPending}
          >
            {logMetricMutation.isPending ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.saveBtnText}>Log Metrics</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Historical Logs List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Metrics Logs History</Text>
          {loadingMetrics ? (
            <ActivityIndicator color="#00F5FF" />
          ) : metrics.length > 0 ? (
            metrics.slice().reverse().map((m) => (
              <View key={m.id} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyWeight}>{m.weight} kg</Text>
                  <Text style={styles.historyDate}>
                    {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>

                <View style={styles.historyDetails}>
                  {m.body_fat ? (
                    <Text style={styles.historyText}>Fat: {m.body_fat}%</Text>
                  ) : null}
                  {m.waist ? (
                    <Text style={styles.historyText}>Waist: {m.waist}cm</Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noHistoryText}>No metric logs registered yet.</Text>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#2C2C2C',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#A0A0A0',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  col: {
    flex: 0.48,
  },
  saveBtn: {
    backgroundColor: '#00F5FF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF2E93',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 46, 147, 0.1)',
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 16,
  },
  successText: {
    color: '#00FF66',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 255, 102, 0.1)',
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 150,
    paddingTop: 10,
  },
  chartYAxis: {
    justifyContent: 'space-between',
    paddingRight: 10,
    borderRightWidth: 1,
    borderColor: '#2C2C2C',
    height: '80%',
  },
  yAxisText: {
    color: '#666',
    fontSize: 10,
    textAlign: 'right',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    paddingLeft: 10,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: '80%',
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barValText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bar: {
    width: 14,
    backgroundColor: '#00F5FF',
    borderRadius: 7,
  },
  barLabel: {
    color: '#666',
    fontSize: 9,
    marginTop: 8,
  },
  noChartContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noChartText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#2C2C2C',
  },
  historyWeight: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  historyDate: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 2,
  },
  historyDetails: {
    alignItems: 'flex-end',
  },
  historyText: {
    fontSize: 12,
    color: '#E0E0E0',
    fontWeight: '500',
    marginVertical: 1,
  },
  noHistoryText: {
    color: '#A0A0A0',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
  },
});
