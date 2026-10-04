import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  login,
  type LoginResponse,
} from '../api/auth';

type LoginScreenProps = {
  onLoginSuccess: (
    response: LoginResponse,
  ) => Promise<void> | void;
};

export default function LoginScreen({
  onLoginSuccess,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    null,
  );

  async function handleLogin() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await login({
        email: normalizedEmail,
        password,
      });

      await onLoginSuccess(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to sign in. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View style={styles.container}>
          <View style={styles.brandSection}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>G</Text>
            </View>

            <Text style={styles.brandName}>
              GoCarto
            </Text>

            <Text style={styles.tagline}>
              Fresh groceries, delivered fast.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.title}>
              Welcome back
            </Text>

            <Text style={styles.subtitle}>
              Sign in to continue shopping.
            </Text>

            <Text style={styles.label}>
              Email
            </Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#9A9E96"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              style={styles.input}
              editable={!loading}
            />

            <Text style={styles.label}>
              Password
            </Text>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9A9E96"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              style={styles.input}
              editable={!loading}
              onSubmitEditing={() => {
                void handleLogin();
              }}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={() => {
                void handleLogin();
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.loginButtonText}>
                  Sign in
                </Text>
              )}
            </Pressable>

            <Text style={styles.helperText}>
              Use your GoCarto customer account to
              continue.
            </Text>
          </View>
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

  keyboardContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  brandSection: {
    alignItems: 'center',
    marginBottom: 28,
  },

  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#1C5934',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },

  brandName: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '900',
    color: '#191C18',
  },

  tagline: {
    marginTop: 5,
    fontSize: 13,
    color: '#777A73',
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E7E9E3',
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#20231F',
  },

  subtitle: {
    marginTop: 5,
    marginBottom: 22,
    fontSize: 13,
    color: '#777A73',
  },

  label: {
    marginTop: 14,
    marginBottom: 7,
    fontSize: 12,
    fontWeight: '700',
    color: '#4F534C',
  },

  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE1D8',
    backgroundColor: '#FAFBF9',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#20231F',
  },

  errorBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFF2F0',
    borderWidth: 1,
    borderColor: '#F0D1CC',
  },

  errorText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#8B3025',
  },

  loginButton: {
    height: 50,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#1C5934',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  helperText: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    color: '#8A8E85',
  },
});