/**
 * Static DID-login screen — the ONLY surface an unauthed visitor sees.
 *
 * Security invariant: no LLM, no dynamic content, no agent backend
 * connection. This screen is fully static — a human authenticates
 * with their sovereign key, nothing else.
 *
 * Supports:
 * - File import: JSON backup with { keypair: { privateKey } } or { privateKey }
 * - Paste: raw 64-character hex private key
 *
 * Styling: amber (#F59E0B) on black, matching the Imajin auth vibe.
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { login } from '@/src/auth';
import { useSession } from '@/src/hooks/useSession';

type ImportMethod = 'file' | 'paste';

export default function LoginScreen() {
  const router = useRouter();
  const { refresh } = useSession();
  const [method, setMethod] = useState<ImportMethod>('file');
  const [privateKeyHex, setPrivateKeyHex] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(
    async (keyHex: string) => {
      setError('');
      setLoading(true);
      try {
        const result = await login(keyHex.trim());
        if (result.success && result.did) {
          await refresh();
          router.replace('/');
        } else if (result.mfaRequired) {
          setError('MFA not supported in MVP yet');
        } else {
          setError(result.error || 'Login failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        setLoading(false);
      }
    },
    [refresh, router]
  );

  const handleFileImport = useCallback(async () => {
    setError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file) {
        setError('No file selected');
        return;
      }

      const response = await fetch(file.uri);
      const text = await response.text();
      const data = JSON.parse(text) as { keypair?: { privateKey?: string }; privateKey?: string };
      const privateKey = data.keypair?.privateKey || data.privateKey;

      if (!privateKey || typeof privateKey !== 'string') {
        setError('Invalid backup file format. Missing privateKey.');
        return;
      }

      await handleLogin(privateKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import backup file');
    }
  }, [handleLogin]);

  const handlePasteSubmit = useCallback(() => {
    if (!privateKeyHex.trim()) {
      setError('Please enter a private key');
      return;
    }
    handleLogin(privateKeyHex);
  }, [privateKeyHex, handleLogin]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jin</Text>
      <Text style={styles.subtitle}>Sign in with your DID</Text>

      {/* Method selector */}
      <View style={styles.methodRow}>
        <TouchableOpacity
          onPress={() => setMethod('file')}
          style={[styles.methodButton, method === 'file' && styles.methodButtonActive]}
          accessibilityRole="button"
          accessibilityLabel="Import file"
        >
          <Text style={[styles.methodText, method === 'file' && styles.methodTextActive]}>
            Import File
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMethod('paste')}
          style={[styles.methodButton, method === 'paste' && styles.methodButtonActive]}
          accessibilityRole="button"
          accessibilityLabel="Paste key"
        >
          <Text style={[styles.methodText, method === 'paste' && styles.methodTextActive]}>
            Paste Key
          </Text>
        </TouchableOpacity>
      </View>

      {/* File import */}
      {method === 'file' && (
        <TouchableOpacity
          onPress={handleFileImport}
          style={styles.fileZone}
          accessibilityRole="button"
          accessibilityLabel="Choose JSON backup file"
        >
          <Text style={styles.fileZoneIcon}>📁</Text>
          <Text style={styles.fileZoneText}>Tap to choose your backup file</Text>
          <Text style={styles.fileZoneHint}>JSON with keypair.privateKey or privateKey</Text>
        </TouchableOpacity>
      )}

      {/* Paste key */}
      {method === 'paste' && (
        <View style={styles.pasteContainer}>
          <Text style={styles.label}>Private Key (hex)</Text>
          <TextInput
            value={privateKeyHex}
            onChangeText={setPrivateKeyHex}
            placeholder="64 character hex string..."
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            numberOfLines={3}
            style={styles.textInput}
            testID="login-private-key-input"
          />
          <TouchableOpacity
            onPress={handlePasteSubmit}
            disabled={loading || !privateKeyHex.trim()}
            style={[styles.submitButton, (loading || !privateKeyHex.trim()) && styles.submitButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Import and sign in"
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Importing…' : 'Import & Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading && method === 'file' ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#F59E0B" />
          <Text style={styles.loadingText}>Verifying identity…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#F59E0B',
  },
  methodText: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  methodTextActive: {
    color: '#000',
  },
  fileZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#374151',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  fileZoneIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  fileZoneText: {
    color: '#D1D5DB',
    fontSize: 16,
    marginBottom: 4,
  },
  fileZoneHint: {
    color: '#6B7280',
    fontSize: 12,
  },
  pasteContainer: {
    gap: 12,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  errorBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#450a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
  },
  loadingBox: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },
});
