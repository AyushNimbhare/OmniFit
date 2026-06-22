import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, 
  TouchableOpacity, ActivityIndicator, Image, Platform, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionService } from '../services/api';
import { ScannedFoodResult } from '../types';

export default function NutritionScreen() {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];

  // Tab State: 'list' | 'manual' | 'ai'
  const [activeTab, setActiveTab] = useState<'list' | 'manual' | 'ai'>('list');

  // Manual Log Form State
  const [manualName, setManualName] = useState('');
  const [manualCal, setManualCal] = useState('');
  const [manualProt, setManualProt] = useState('');
  const [manualCarb, setManualCarb] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualQty, setManualQty] = useState('1 serving');
  const [manualError, setManualError] = useState('');

  // AI Scanner State
  const [aiDescription, setAiDescription] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedFoodResult | null>(null);
  const [scanError, setScanError] = useState('');

  // Queries
  const { data: meals = [], isLoading: loadingMeals } = useQuery({
    queryKey: ['nutritionToday', todayStr],
    queryFn: () => nutritionService.getLogs(todayStr),
  });

  // Mutations
  const logMealMutation = useMutation({
    mutationFn: nutritionService.logMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionToday', todayStr] });
      queryClient.invalidateQueries({ queryKey: ['latestInsight'] });
      setActiveTab('list');
      resetForm();
    },
    onError: (err: any) => {
      setManualError('Failed to log meal. Please check values.');
    }
  });

  // Actions
  const resetForm = () => {
    setManualName('');
    setManualCal('');
    setManualProt('');
    setManualCarb('');
    setManualFat('');
    setManualQty('1 serving');
    setManualError('');
    setAiDescription('');
    setSelectedImageUri(null);
    setScanResult(null);
    setScanError('');
  };

  const handleManualSubmit = () => {
    if (!manualName || !manualCal || !manualProt || !manualCarb || !manualFat) {
      setManualError('All fields are required.');
      return;
    }
    setManualError('');
    logMealMutation.mutate({
      food_name: manualName,
      calories: parseFloat(manualCal) || 0,
      protein: parseFloat(manualProt) || 0,
      carbs: parseFloat(manualCarb) || 0,
      fat: parseFloat(manualFat) || 0,
      quantity: manualQty,
    });
  };

  const handlePickImage = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setSelectedImageUri(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      alert('Photo uploads are supported on Web. For mobile, please describe your food below.');
    }
  };

  const handleAIScan = async () => {
    if (!selectedImageUri && !aiDescription) {
      setScanError('Please enter a description or upload a photo.');
      return;
    }

    setScanning(true);
    setScanError('');
    setScanResult(null);

    try {
      let result;
      if (selectedImageUri) {
        result = await nutritionService.scanMealImage(selectedImageUri, aiDescription);
      } else {
        result = await nutritionService.scanMealDescription(aiDescription);
      }
      
      setScanResult(result);
      // Pre-fill manual form with AI recommendations for verification
      setManualName(result.food_name);
      setManualCal(result.calories.toString());
      setManualProt(result.protein.toString());
      setManualCarb(result.carbs.toString());
      setManualFat(result.fat.toString());
      setManualQty(result.quantity);
    } catch (e: any) {
      setScanError('Scanning failed. Make sure the backend is running and online.');
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmAIScan = () => {
    if (!manualName || !manualCal) return;
    logMealMutation.mutate({
      food_name: manualName,
      calories: parseFloat(manualCal) || 0,
      protein: parseFloat(manualProt) || 0,
      carbs: parseFloat(manualCarb) || 0,
      fat: parseFloat(manualFat) || 0,
      quantity: manualQty,
    });
  };

  // Calculations
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <Text style={styles.totalCalBadge}>{Math.round(totalCalories)} kcal today</Text>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'list' && styles.activeTab]}
          onPress={() => { setActiveTab('list'); resetForm(); }}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>Meals</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
          onPress={() => { setActiveTab('manual'); resetForm(); }}
        >
          <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>Manual Log</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ai' && styles.activeTab]}
          onPress={() => { setActiveTab('ai'); resetForm(); }}
        >
          <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>⚡ AI Scanner</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {activeTab === 'list' && (
          // Logged Meals List
          <>
            {loadingMeals ? (
              <ActivityIndicator size="large" color="#00F5FF" style={{ marginTop: 40 }} />
            ) : meals.length > 0 ? (
              meals.map((meal) => (
                <View key={meal.id} style={styles.card}>
                  <View style={styles.mealHeader}>
                    <View style={{ flex: 0.7 }}>
                      <Text style={styles.mealName}>{meal.food_name}</Text>
                      <Text style={styles.mealQty}>{meal.quantity}</Text>
                    </View>
                    <Text style={styles.mealCal}>{Math.round(meal.calories)} kcal</Text>
                  </View>

                  <View style={styles.macroStrip}>
                    <View style={styles.macroIndicator}>
                      <Text style={styles.macroIndLabel}>P: </Text>
                      <Text style={styles.macroIndVal}>{Math.round(meal.protein)}g</Text>
                    </View>
                    <View style={styles.macroIndicator}>
                      <Text style={styles.macroIndLabel}>C: </Text>
                      <Text style={styles.macroIndVal}>{Math.round(meal.carbs)}g</Text>
                    </View>
                    <View style={styles.macroIndicator}>
                      <Text style={styles.macroIndLabel}>F: </Text>
                      <Text style={styles.macroIndVal}>{Math.round(meal.fat)}g</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="restaurant-outline" size={60} color="#333" />
                <Text style={styles.emptyText}>No food logged today</Text>
                <Text style={styles.emptySub}>Log meals manually or scan with AI to track macros.</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'manual' && (
          // Manual Logging Form
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Log Meal Manually</Text>

            {manualError ? <Text style={styles.errorText}>{manualError}</Text> : null}

            <Text style={styles.label}>Food Name</Text>
            <TextInput 
              style={styles.input}
              value={manualName}
              onChangeText={setManualName}
              placeholder="e.g. Salmon with Sweet Potato"
              placeholderTextColor="#666"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Portion Size / Quantity</Text>
            <TextInput 
              style={styles.input}
              value={manualQty}
              onChangeText={setManualQty}
              placeholder="e.g. 1 plate, 200g"
              placeholderTextColor="#666"
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Calories (kcal)</Text>
                <TextInput 
                  style={styles.input}
                  value={manualCal}
                  onChangeText={setManualCal}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Protein (g)</Text>
                <TextInput 
                  style={styles.input}
                  value={manualProt}
                  onChangeText={setManualProt}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Carbs (g)</Text>
                <TextInput 
                  style={styles.input}
                  value={manualCarb}
                  onChangeText={setManualCarb}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Fat (g)</Text>
                <TextInput 
                  style={styles.input}
                  value={manualFat}
                  onChangeText={setManualFat}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleManualSubmit}
              disabled={logMealMutation.isPending}
            >
              {logMealMutation.isPending ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.saveBtnText}>Log Meal</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'ai' && (
          // AI Scanner Form
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚡ AI Food Scanner</Text>
            <Text style={styles.scannerSub}>
              Gemini will analyze your meal photo or text details to estimate portions, calories, and macros.
            </Text>

            {scanError ? <Text style={styles.errorText}>{scanError}</Text> : null}

            {/* Photo upload section */}
            <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
              {selectedImageUri ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: selectedImageUri }} style={styles.selectedImage} />
                  <View style={styles.changeImageOverlay}>
                    <Text style={styles.changeImageText}>Change Photo</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={32} color="#00F5FF" />
                  <Text style={styles.imagePlaceholderText}>Upload Food Photo</Text>
                  <Text style={styles.imagePlaceholderSub}>(Supported on web browsers)</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Description Text Input */}
            <Text style={styles.label}>Describe what you ate (Optional)</Text>
            <TextInput 
              style={[styles.input, styles.textArea]}
              value={aiDescription}
              onChangeText={setAiDescription}
              multiline={true}
              numberOfLines={3}
              placeholder="e.g. 2 slices of pepperoni pizza and a green salad with light dressing..."
              placeholderTextColor="#666"
            />

            <TouchableOpacity 
              style={styles.scanBtn} 
              onPress={handleAIScan}
              disabled={scanning}
            >
              {scanning ? (
                <View style={styles.rowAlign}>
                  <ActivityIndicator color="#000" style={{ marginRight: 8 }} />
                  <Text style={styles.scanBtnText}>Analyzing Plate...</Text>
                </View>
              ) : (
                <Text style={styles.scanBtnText}>Scan with GymAI</Text>
              )}
            </TouchableOpacity>

            {/* Scan Results Verification & Confirm Card */}
            {scanResult && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultHeader}>🔍 AI Identified Estimates</Text>
                <Text style={styles.resultLabel}>Review & tweak values below, then click Log:</Text>

                {/* We map the outputs directly into editable text fields (reuse manual form fields) */}
                <Text style={[styles.label, { marginTop: 12 }]}>Food Name</Text>
                <TextInput style={styles.input} value={manualName} onChangeText={setManualName} />

                <Text style={[styles.label, { marginTop: 12 }]}>Estimated Portion</Text>
                <TextInput style={styles.input} value={manualQty} onChangeText={setManualQty} />

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Calories (kcal)</Text>
                    <TextInput style={styles.input} value={manualCal} onChangeText={setManualCal} keyboardType="numeric" />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Protein (g)</Text>
                    <TextInput style={styles.input} value={manualProt} onChangeText={setManualProt} keyboardType="numeric" />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Carbs (g)</Text>
                    <TextInput style={styles.input} value={manualCarb} onChangeText={setManualCarb} keyboardType="numeric" />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Fat (g)</Text>
                    <TextInput style={styles.input} value={manualFat} onChangeText={setManualFat} keyboardType="numeric" />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.saveBtn, { marginTop: 16 }]} 
                  onPress={handleConfirmAIScan}
                  disabled={logMealMutation.isPending}
                >
                  {logMealMutation.isPending ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.saveBtnText}>✓ Confirm & Log Meal</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalCalBadge: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    color: '#00F5FF',
    fontSize: 12,
    fontWeight: 'bold',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderColor: '#2C2C2C',
    padding: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  tabText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#00F5FF',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderColor: '#2C2C2C',
    paddingBottom: 10,
    marginBottom: 10,
  },
  mealName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mealQty: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 2,
  },
  mealCal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00F5FF',
  },
  macroStrip: {
    flexDirection: 'row',
  },
  macroIndicator: {
    flexDirection: 'row',
    marginRight: 16,
  },
  macroIndLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  macroIndVal: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  scannerSub: {
    color: '#A0A0A0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  imagePickerBtn: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 150,
    backgroundColor: '#121212',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#2C2C2C',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  imagePlaceholderSub: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeImageText: {
    color: '#00F5FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scanBtn: {
    backgroundColor: '#00F5FF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  scanBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderColor: '#2C2C2C',
    paddingTop: 20,
  },
  resultHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#00F5FF',
    marginBottom: 4,
  },
  resultLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    marginBottom: 16,
  },
});
