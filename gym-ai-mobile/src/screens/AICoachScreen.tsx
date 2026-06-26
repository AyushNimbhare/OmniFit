import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, 
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { coachService } from '../services/api';
import { parseMarkdown } from '../services/markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  "How is my weekly training consistency?",
  "Am I hitting my protein targets?",
  "What should I do if my bench press stalls?",
  "Analyze my body weight trend."
];

export default function AICoachScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am your OmniFit Coach. 🧠 I analyze what you lift, what you eat, and how your body weight changes to give you elite-level advice. Ask me anything, or tap one of the quick questions below to get started!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto scroll to bottom when messages list changes
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Filter previous messages (limit to last 6 for token efficiency)
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Call API
      const coachResponse = await coachService.chatWithCoach(userMessage.content, chatHistory);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: coachResponse
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (e) {
      console.error(e);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting to my database right now. Please make sure the OmniFit backend server is running locally and try again!"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={16} color="#000" />
          </View>
          <View>
            <Text style={styles.headerTitle}>OmniFit Coach</Text>
            <Text style={styles.headerStatus}>Online & Analyzing</Text>
          </View>
        </View>
      </View>

      {/* Messages Feed */}
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <View 
            key={msg.id} 
            style={[
              styles.messageRow, 
              msg.role === 'user' ? styles.userRow : styles.assistantRow
            ]}
          >
            {msg.role === 'assistant' && (
              <View style={styles.coachAvatarMini}>
                <Ionicons name="sparkles-outline" size={12} color="#00F5FF" />
              </View>
            )}
            <View 
              style={[
                styles.bubble, 
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble
              ]}
            >
              {msg.role === 'user' ? (
                <Text style={[
                  styles.messageText, 
                  msg.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                ]}>
                  {msg.content}
                </Text>
              ) : (
                parseMarkdown(
                  msg.content, 
                  [styles.messageText, styles.assistantMessageText],
                  { color: '#00F5FF' }
                )
              )}
            </View>
          </View>
        ))}

        {loading && (
          <View style={[styles.messageRow, styles.assistantRow]}>
            <View style={styles.coachAvatarMini}>
              <Ionicons name="sparkles-outline" size={12} color="#00F5FF" />
            </View>
            <View style={[styles.bubble, styles.assistantBubble, styles.thinkingBubble]}>
              <ActivityIndicator size="small" color="#00F5FF" />
              <Text style={[styles.messageText, styles.assistantMessageText, { marginLeft: 8 }]}>
                Analyzing logs...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Questions Chips */}
      {messages.length === 1 && !loading && (
        <View style={styles.quickQuestionsContainer}>
          <Text style={styles.quickSectionTitle}>💡 Suggested Questions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {QUICK_QUESTIONS.map((q, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.chip}
                onPress={() => handleSendMessage(q)}
              >
                <Text style={styles.chipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput 
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Coach advice..."
          placeholderTextColor="#666"
          onSubmitEditing={() => handleSendMessage(input)}
          autoCorrect={true}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !input.trim() && styles.disabledSendBtn]} 
          onPress={() => handleSendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={18} color={input.trim() ? "#000" : "#666"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerStatus: {
    fontSize: 11,
    color: '#00F5FF',
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
    width: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  coachAvatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#00F5FF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    borderBottomLeftRadius: 4,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#000000',
    fontWeight: '500',
  },
  assistantMessageText: {
    color: '#E0E0E0',
  },
  quickQuestionsContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#2C2C2C',
    backgroundColor: '#121212',
  },
  quickSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#A0A0A0',
    marginHorizontal: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  chipsScroll: {
    paddingHorizontal: 20,
  },
  chip: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 4,
  },
  chipText: {
    color: '#00F5FF',
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderColor: '#2C2C2C',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 12,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#00F5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledSendBtn: {
    backgroundColor: '#2C2C2C',
  },
});
