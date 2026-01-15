import { useStores } from '@shared/stores/setup';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default observer(function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { authStore } = useStores();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>LEVEL</Text>
      <Text style={styles.subtitle}>Welcome back.</Text>

      <View style={styles.card}>
        <Text style={styles.email}>{authStore.email}</Text>
        <Text style={styles.status}>Status: Authenticated</Text>
      </View>

      <TouchableOpacity onPress={() => authStore.logout()} style={styles.button}>
        <Text style={styles.buttonText}>LOG OUT</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 24,
  },
  title: {
    color: '#CCFF00',
    fontSize: 24,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 32,
    marginTop: 8,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  card: {
    backgroundColor: '#1E1E1E',
    padding: 24,
    borderRadius: 16,
    marginTop: 40,
  },
  email: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  status: {
    color: '#A0A0A0',
    marginTop: 8,
  },
  button: {
    marginTop: 40,
    backgroundColor: '#333',
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFF',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});
