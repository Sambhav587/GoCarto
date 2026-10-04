import React, {
  useState,
} from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { askAi } from '../api/client';
import { getAccessToken } from '../api/auth-storage';

type AIAssistantScreenProps = {
  onBack: () => void;
};

type Message = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
};

const suggestions = [
  'What is the price of apples?',
  'Are apples in stock?',
  'Add 2 apples to my cart',
  'Add 1 milk to my cart',
];

export function AIAssistantScreen({
  onBack,
}: AIAssistantScreenProps) {
  const [input, setInput] = useState('');

  const [messages, setMessages] =
    useState<Message[]>([
      {
        id: 1,
        role: 'assistant',
        text:
          'Hi! I’m GoCarto AI. Ask me about products, prices, availability, or tell me what you want to add to your cart.',
      },
    ]);

  const [sending, setSending] =
    useState(false);

  async function handleSend(
    text?: string,
  ) {
    const message =
      (text ?? input).trim();

    if (!message || sending) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      text: message,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput('');
    setSending(true);

    try {
      const token =
        await getAccessToken();

      if (!token) {
        throw new Error(
          'Please log in to use GoCarto AI.',
        );
      }

      const result =
        await askAi(
          message,
          token,
        );

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        text: result.answer,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Something went wrong while contacting GoCarto AI.';

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        text: errorMessage,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        keyboardVerticalOffset={10}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={styles.backText}>
              ‹
            </Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <View style={styles.aiAvatar}>
              <Text style={styles.aiAvatarText}>
                ✨
              </Text>
            </View>

            <View>
              <Text style={styles.headerTitle}>
                GoCarto AI
              </Text>

              <View style={styles.onlineRow}>
                <View
                  style={styles.onlineDot}
                />

                <Text
                  style={styles.onlineText}
                >
                  Live shopping assistant
                </Text>
              </View>
            </View>
          </View>

          <View
            style={styles.headerSpacer}
          />
        </View>

        <ScrollView
          style={styles.messagesScroll}
          contentContainerStyle={
            styles.messagesContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={styles.welcomeCard}
          >
            <View
              style={styles.welcomeIcon}
            >
              <Text
                style={
                  styles.welcomeIconText
                }
              >
                ✨
              </Text>
            </View>

            <Text
              style={styles.welcomeTitle}
            >
              Your GoCarto shopping assistant
            </Text>

            <Text
              style={styles.welcomeText}
            >
              Ask about real catalogue products,
              prices, stock, or add products
              directly to your cart.
            </Text>
          </View>

          {messages.map((message) => {
            const isAssistant =
              message.role ===
              'assistant';

            return (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  !isAssistant &&
                    styles.messageRowUser,
                ]}
              >
                {isAssistant ? (
                  <View
                    style={
                      styles.smallAvatar
                    }
                  >
                    <Text
                      style={
                        styles.smallAvatarText
                      }
                    >
                      ✨
                    </Text>
                  </View>
                ) : null}

                <View
                  style={[
                    styles.messageBubble,
                    isAssistant
                      ? styles.assistantBubble
                      : styles.userBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      !isAssistant &&
                        styles.userMessageText,
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              </View>
            );
          })}

          {sending ? (
            <View
              style={styles.messageRow}
            >
              <View
                style={styles.smallAvatar}
              >
                <Text
                  style={
                    styles.smallAvatarText
                  }
                >
                  ✨
                </Text>
              </View>

              <View
                style={[
                  styles.messageBubble,
                  styles.assistantBubble,
                  styles.typingBubble,
                ]}
              >
                <ActivityIndicator
                  size="small"
                />

                <Text
                  style={styles.typingText}
                >
                  Checking GoCarto...
                </Text>
              </View>
            </View>
          ) : null}

          {messages.length === 1 &&
          !sending ? (
            <View
              style={
                styles.suggestionsSection
              }
            >
              <Text
                style={
                  styles.suggestionsTitle
                }
              >
                Try asking
              </Text>

              <View
                style={styles.suggestions}
              >
                {suggestions.map(
                  (suggestion) => (
                    <Pressable
                      key={suggestion}
                      style={
                        styles.suggestion
                      }
                      onPress={() => {
                        void handleSend(
                          suggestion,
                        );
                      }}
                    >
                      <Text
                        style={
                          styles.suggestionText
                        }
                      >
                        {suggestion}
                      </Text>

                      <Text
                        style={
                          styles.suggestionArrow
                        }
                      >
                        ›
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={styles.inputArea}
        >
          <View
            style={styles.inputContainer}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about groceries..."
              placeholderTextColor="#9A9E96"
              style={styles.input}
              multiline
              maxLength={500}
              editable={!sending}
              onSubmitEditing={() => {
                void handleSend();
              }}
            />

            <Pressable
              style={[
                styles.sendButton,
                (!input.trim() ||
                  sending) &&
                  styles.sendButtonDisabled,
              ]}
              disabled={
                !input.trim() ||
                sending
              }
              onPress={() => {
                void handleSend();
              }}
            >
              {sending ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={styles.sendText}
                >
                  ↑
                </Text>
              )}
            </Pressable>
          </View>

          <Text
            style={styles.disclaimer}
          >
            GoCarto AI uses live catalogue data
            for product information.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8F5',
  },

  screen: {
    flex: 1,
  },

  header: {
    height: 72,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E9E3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 31,
    lineHeight: 34,
    color: '#20231F',
    marginTop: -3,
  },

  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiAvatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  aiAvatarText: {
    fontSize: 21,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#20231F',
  },

  onlineRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#20A15A',
    marginRight: 5,
  },

  onlineText: {
    fontSize: 10,
    color: '#777A73',
  },

  headerSpacer: {
    width: 42,
  },

  messagesScroll: {
    flex: 1,
  },

  messagesContent: {
    padding: 20,
    paddingBottom: 25,
  },

  welcomeCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#E9F4EC',
    marginBottom: 22,
    alignItems: 'center',
  },

  welcomeIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  welcomeIconText: {
    fontSize: 25,
  },

  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#173A25',
    textAlign: 'center',
  },

  welcomeText: {
    marginTop: 7,
    maxWidth: 310,
    fontSize: 13,
    lineHeight: 19,
    color: '#56705E',
    textAlign: 'center',
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 13,
  },

  messageRowUser: {
    justifyContent: 'flex-end',
  },

  smallAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#E9F4EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  smallAvatarText: {
    fontSize: 15,
  },

  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
  },

  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9E3',
    borderBottomLeftRadius: 5,
  },

  userBubble: {
    backgroundColor: '#176B3A',
    borderBottomRightRadius: 5,
  },

  messageText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#30342E',
  },

  userMessageText: {
    color: '#FFFFFF',
  },

  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  typingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#777A73',
  },

  suggestionsSection: {
    marginTop: 5,
  },

  suggestionsTitle: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '800',
    color: '#4F534C',
  },

  suggestions: {
    gap: 9,
  },

  suggestion: {
    minHeight: 45,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9E3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  suggestionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#30342E',
  },

  suggestionArrow: {
    marginLeft: 10,
    fontSize: 21,
    color: '#176B3A',
  },

  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7E9E3',
  },

  inputContainer: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: '#F3F5EF',
    borderWidth: 1,
    borderColor: '#E1E4DC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 6,
  },

  input: {
    flex: 1,
    maxHeight: 90,
    paddingVertical: 10,
    fontSize: 13,
    color: '#20231F',
  },

  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#176B3A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.4,
  },

  sendText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: -2,
  },

  disclaimer: {
    marginTop: 7,
    fontSize: 9,
    lineHeight: 13,
    color: '#9A9E96',
    textAlign: 'center',
  },
});