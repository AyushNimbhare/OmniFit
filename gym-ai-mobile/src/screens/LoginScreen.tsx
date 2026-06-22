import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import { isFirebaseEnabled } from '../services/firebase';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleAuthAction = async () => {
    if (!email) {
      setError('Email is required.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }

    if (isFirebaseEnabled) {
      if (!password) {
        setError('Password is required.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (isRegisterMode && !name) {
        setError('Full Name is required for registration.');
        return;
      }
    }

    setError('');
    setLoading(true);
    try {
      if (isFirebaseEnabled) {
        if (isRegisterMode) {
          await register(name, email, password);
        } else {
          await login(email, password);
        }
      } else {
        // Local Bypass Mode (does not use password)
        await login(email, undefined, name);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <Text style={styles.logoText}>Gym<Text style={styles.logoAccent}>AI</Text></Text>
          <Text style={styles.subtitle}>AI-Powered Strength & Nutrition</Text>
        </View>

        <View style={styles.formContainer}>
          {isFirebaseEnabled ? (
            <>
              <Text style={styles.welcomeTitle}>{isRegisterMode ? 'Create Account' : 'Welcome Back'}</Text>
              <Text style={styles.welcomeSubtitle}>
                {isRegisterMode ? 'Sign up to track your fitness journey' : 'Sign in to access your workouts & macros'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>Sign in to track your workouts & macros</Text>
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Full Name field (Required for Register in Firebase, Optional in Bypass) */}
          {(!isFirebaseEnabled || isRegisterMode) && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name {isFirebaseEnabled ? '(Required)' : '(Optional)'}</Text>
              <TextInput 
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoCorrect={false}
              />
            </View>
          )}

          {/* Email field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password field (Only visible when Firebase is enabled) */}
          {isFirebaseEnabled && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput 
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.button}
            onPress={handleAuthAction}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>
                {isFirebaseEnabled 
                  ? (isRegisterMode ? 'Sign Up' : 'Sign In') 
                  : 'Get Started'
                }
              </Text>
            )}
          </TouchableOpacity>

          {/* Real Firebase Mode toggle link */}
          {isFirebaseEnabled && (
            <TouchableOpacity 
              style={styles.toggleLink} 
              onPress={() => {
                setIsRegisterMode(!isRegisterMode);
                setError('');
              }}
            >
              <Text style={styles.toggleLinkText}>
                {isRegisterMode 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"
                }
              </Text>
            </TouchableOpacity>
          )}

          {/* Bypass mode message */}
          {!isFirebaseEnabled && (
            <View style={styles.bypassNoteContainer}>
              <Text style={styles.bypassNoteTitle}>💡 Local Testing Mode</Text>
              <Text style={styles.bypassNoteText}>
                Any email and name works. The backend will automatically synchronize or register this user in SQLite.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  logoAccent: {
    color: '#00F5FF', // Neon Cyan
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 8,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  formContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 4,
    marginBottom: 24,
  },
  errorText: {
    color: '#FF2E93', // Neon Pink
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 46, 147, 0.1)',
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0A0A0',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    borderRadius: 10,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#00F5FF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleLink: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  toggleLinkText: {
    color: '#00F5FF',
    fontSize: 14,
    fontWeight: '600',
  },
  bypassNoteContainer: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginTop: 24,
  },
  bypassNoteTitle: {
    color: '#00F5FF',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bypassNoteText: {
    color: '#A0A0A0',
    fontSize: 11,
    lineHeight: 16,
  },
});
