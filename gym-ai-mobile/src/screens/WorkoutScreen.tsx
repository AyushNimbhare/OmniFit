import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  TextInput, Modal, ActivityIndicator, FlatList, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutService } from '../services/api';
import { Exercise, WorkoutLog } from '../types';

export default function WorkoutScreen() {
  const queryClient = useQueryClient();
  const [isLogging, setIsLogging] = useState(false);
  const [workoutName, setWorkoutName] = useState('Workout');
  const [duration, setDuration] = useState('45');
  const [currentLogs, setCurrentLogs] = useState<any[]>([]); // Array of { exercise: Exercise, sets: { reps: string, weight: string }[] }
  
  // Exercise Selection Modal
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Exercise Creation
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const [customExerciseError, setCustomExerciseError] = useState('');

  // Queries
  const { data: workouts = [], isLoading: loadingWorkouts } = useQuery({
    queryKey: ['workouts'],
    queryFn: workoutService.getWorkouts,
  });

  const { data: exercises = [], isLoading: loadingExercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: workoutService.getExercises,
  });

  // Mutations
  const saveWorkoutMutation = useMutation({
    mutationFn: workoutService.createWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['prs'] });
      queryClient.invalidateQueries({ queryKey: ['latestInsight'] });
      setIsLogging(false);
      resetLogForm();
    },
  });

  const createExerciseMutation = useMutation({
    mutationFn: ({ name, muscle, equipment }: any) => 
      workoutService.createCustomExercise(name, muscle, equipment),
    onSuccess: (newEx) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      addExerciseToWorkout(newEx);
      setIsCreatingExercise(false);
      setCustomName('');
      setCustomMuscle('');
      setCustomEquipment('');
      setExerciseModalVisible(false);
    },
    onError: (err: any) => {
      setCustomExerciseError(err.response?.data?.detail || 'Failed to create exercise.');
    }
  });

  // Actions
  const resetLogForm = () => {
    setWorkoutName('Workout');
    setDuration('45');
    setCurrentLogs([]);
  };

  const addExerciseToWorkout = (exercise: Exercise) => {
    // Add exercise with 1 default set
    setCurrentLogs([
      ...currentLogs,
      {
        exercise,
        sets: [{ reps: '8', weight: '60' }]
      }
    ]);
    setExerciseModalVisible(false);
  };

  const addSet = (logIndex: number) => {
    const updated = [...currentLogs];
    const sets = updated[logIndex].sets;
    const lastSet = sets[sets.length - 1] || { reps: '8', weight: '60' };
    sets.push({ reps: lastSet.reps, weight: lastSet.weight });
    setCurrentLogs(updated);
  };

  const removeSet = (logIndex: number, setIndex: number) => {
    const updated = [...currentLogs];
    updated[logIndex].sets.splice(setIndex, 1);
    if (updated[logIndex].sets.length === 0) {
      updated.splice(logIndex, 1); // remove exercise entirely if no sets
    }
    setCurrentLogs(updated);
  };

  const updateSetText = (logIndex: number, setIndex: number, field: 'reps' | 'weight', text: string) => {
    const updated = [...currentLogs];
    updated[logIndex].sets[setIndex][field] = text;
    setCurrentLogs(updated);
  };

  const handleSaveWorkout = () => {
    if (currentLogs.length === 0) {
      alert('Please add at least one exercise and set.');
      return;
    }

    const flatLogs: any[] = [];
    currentLogs.forEach((log) => {
      log.sets.forEach((set: any, idx: number) => {
        flatLogs.push({
          exercise_id: log.exercise.id,
          set_number: idx + 1,
          reps: parseInt(set.reps) || 0,
          weight: parseFloat(set.weight) || 0.0,
        });
      });
    });

    saveWorkoutMutation.mutate({
      name: workoutName || 'Workout',
      duration: parseInt(duration) || 0,
      logs: flatLogs,
    });
  };

  const handleCreateCustomExercise = () => {
    if (!customName || !customMuscle || !customEquipment) {
      setCustomExerciseError('Please fill out all fields.');
      return;
    }
    setCustomExerciseError('');
    createExerciseMutation.mutate({
      name: customName,
      muscle: customMuscle,
      equipment: customEquipment
    });
  };

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isLogging ? 'Log Active Workout' : 'Workouts'}</Text>
        {!isLogging && (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => {
              setWorkoutName(`Workout on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
              setIsLogging(true);
            }}
          >
            <Text style={styles.addButtonText}>+ Start</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLogging ? (
        // Workout Creator Screen
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.card}>
            <Text style={styles.label}>Workout Title</Text>
            <TextInput 
              style={styles.input}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="e.g. Chest & Triceps"
              placeholderTextColor="#666"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Duration (minutes)</Text>
            <TextInput 
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="45"
              placeholderTextColor="#666"
            />
          </View>

          {currentLogs.map((log, logIndex) => (
            <View key={logIndex} style={[styles.card, { paddingBottom: 10 }]}>
              <View style={styles.exerciseHeader}>
                <View>
                  <Text style={styles.exerciseName}>{log.exercise.name}</Text>
                  <Text style={styles.exerciseMuscle}>{log.exercise.muscle_group} • {log.exercise.equipment}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    const updated = [...currentLogs];
                    updated.splice(logIndex, 1);
                    setCurrentLogs(updated);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF2E93" />
                </TouchableOpacity>
              </View>

              {/* Set headers */}
              <View style={styles.setRowHeader}>
                <Text style={[styles.setHeaderText, { flex: 0.15 }]}>Set</Text>
                <Text style={[styles.setHeaderText, { flex: 0.35 }]}>Weight (kg)</Text>
                <Text style={[styles.setHeaderText, { flex: 0.35 }]}>Reps</Text>
                <Text style={[styles.setHeaderText, { flex: 0.15 }]}></Text>
              </View>

              {/* Sets */}
              {log.sets.map((set: any, setIndex: number) => (
                <View key={setIndex} style={styles.setRow}>
                  <Text style={styles.setNumber}>{setIndex + 1}</Text>
                  <TextInput 
                    style={styles.setInput}
                    value={set.weight}
                    onChangeText={(val) => updateSetText(logIndex, setIndex, 'weight', val)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#666"
                  />
                  <TextInput 
                    style={styles.setInput}
                    value={set.reps}
                    onChangeText={(val) => updateSetText(logIndex, setIndex, 'reps', val)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#666"
                  />
                  <TouchableOpacity 
                    style={styles.setDelete} 
                    onPress={() => removeSet(logIndex, setIndex)}
                  >
                    <Ionicons name="close-circle-outline" size={22} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(logIndex)}>
                <Text style={styles.addSetButtonText}>+ Add Set</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity 
            style={styles.selectExerciseBtn} 
            onPress={() => setExerciseModalVisible(true)}
          >
            <Text style={styles.selectExerciseBtnText}>+ Add Exercise</Text>
          </TouchableOpacity>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.cancelBtn]} 
              onPress={() => {
                setIsLogging(false);
                resetLogForm();
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.saveBtn]} 
              onPress={handleSaveWorkout}
              disabled={saveWorkoutMutation.isPending}
            >
              {saveWorkoutMutation.isPending ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.saveBtnText}>Finish Workout</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        // Workout History Screen
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {loadingWorkouts ? (
            <ActivityIndicator size="large" color="#00F5FF" style={{ marginTop: 40 }} />
          ) : workouts.length > 0 ? (
            workouts.map((w) => (
              <View key={w.id} style={styles.card}>
                <View style={styles.historyCardHeader}>
                  <View>
                    <Text style={styles.historyCardTitle}>{w.name}</Text>
                    <Text style={styles.historyCardDate}>
                      {new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.historyBadge}>
                    <Ionicons name="time-outline" size={14} color="#00F5FF" style={{ marginRight: 4 }} />
                    <Text style={styles.historyBadgeText}>{w.duration}m</Text>
                  </View>
                </View>

                {/* Group logs by exercise for cleaner history listing */}
                {Object.entries(
                  w.logs.reduce((acc, log) => {
                    const name = log.exercise_name || 'Exercise';
                    if (!acc[name]) acc[name] = [];
                    acc[name].push(log);
                    return acc;
                  }, {} as Record<string, typeof w.logs>)
                ).map(([exName, exLogs], idx) => (
                  <View key={idx} style={styles.historyExRow}>
                    <Text style={styles.historyExName}>{exName}</Text>
                    <Text style={styles.historyExSets}>
                      {exLogs.map(l => `${l.weight}kg x ${l.reps}`).join(' | ')}
                    </Text>
                  </View>
                ))}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="barbell-outline" size={60} color="#333" />
              <Text style={styles.emptyText}>No workouts logged yet</Text>
              <Text style={styles.emptySub}>Start logging your training to track progress.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Exercise Selection Modal */}
      <Modal
        visible={exerciseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExerciseModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isCreatingExercise ? 'New Exercise' : 'Select Exercise'}
              </Text>
              <TouchableOpacity onPress={() => {
                setExerciseModalVisible(false);
                setIsCreatingExercise(false);
              }}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {isCreatingExercise ? (
              // Custom Exercise Form
              <View style={styles.customExForm}>
                {customExerciseError ? (
                  <Text style={styles.errorText}>{customExerciseError}</Text>
                ) : null}

                <Text style={styles.label}>Exercise Name</Text>
                <TextInput 
                  style={styles.input}
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="e.g. Romanian Deadlift"
                  placeholderTextColor="#666"
                />

                <Text style={[styles.label, { marginTop: 12 }]}>Muscle Group</Text>
                <TextInput 
                  style={styles.input}
                  value={customMuscle}
                  onChangeText={setCustomMuscle}
                  placeholder="e.g. Hamstrings"
                  placeholderTextColor="#666"
                />

                <Text style={[styles.label, { marginTop: 12 }]}>Equipment</Text>
                <TextInput 
                  style={styles.input}
                  value={customEquipment}
                  onChangeText={setCustomEquipment}
                  placeholder="e.g. Barbell"
                  placeholderTextColor="#666"
                />

                <TouchableOpacity 
                  style={styles.saveBtn} 
                  onPress={handleCreateCustomExercise}
                  disabled={createExerciseMutation.isPending}
                >
                  {createExerciseMutation.isPending ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.saveBtnText}>Create & Select</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.cancelBtn, { marginTop: 10, padding: 14 }]} 
                  onPress={() => setIsCreatingExercise(false)}
                >
                  <Text style={styles.cancelBtnText}>Back to List</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Search & List
              <>
                <TextInput 
                  style={styles.searchBar}
                  placeholder="Search exercise or muscle..."
                  placeholderTextColor="#666"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                <TouchableOpacity 
                  style={styles.createCustomExLink}
                  onPress={() => setIsCreatingExercise(true)}
                >
                  <Text style={styles.createCustomExLinkText}>✨ Create Custom Exercise</Text>
                </TouchableOpacity>

                {loadingExercises ? (
                  <ActivityIndicator color="#00F5FF" style={{ margin: 20 }} />
                ) : (
                  <FlatList 
                    data={filteredExercises}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={styles.exerciseItem}
                        onPress={() => addExerciseToWorkout(item)}
                      >
                        <View>
                          <Text style={styles.exerciseItemName}>{item.name}</Text>
                          <Text style={styles.exerciseItemDetails}>{item.muscle_group} • {item.equipment}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#444" />
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#00F5FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C2C',
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
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#2C2C2C',
    paddingBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exerciseMuscle: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 2,
  },
  setRowHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  setHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#A0A0A0',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  setNumber: {
    flex: 0.15,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  setInput: {
    flex: 0.35,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    borderRadius: 6,
    padding: 8,
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  setDelete: {
    flex: 0.15,
    alignItems: 'center',
  },
  addSetButton: {
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  addSetButtonText: {
    color: '#00F5FF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  selectExerciseBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#00F5FF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  selectExerciseBtnText: {
    color: '#00F5FF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    flex: 0.48,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  cancelBtnText: {
    color: '#FF2E93',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#00F5FF',
  },
  saveBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderColor: '#2C2C2C',
    paddingBottom: 10,
    marginBottom: 10,
  },
  historyCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  historyCardDate: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 2,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  historyBadgeText: {
    color: '#00F5FF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  historyExRow: {
    marginVertical: 4,
  },
  historyExName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  historyExSets: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A0A0A0',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    height: '75%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchBar: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  createCustomExLink: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  createCustomExLinkText: {
    color: '#00F5FF',
    fontSize: 13,
    fontWeight: '600',
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#2C2C2C',
  },
  exerciseItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exerciseItemDetails: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 2,
  },
  customExForm: {
    paddingTop: 10,
  },
  errorText: {
    color: '#FF2E93',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(255,46,147,0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
});
