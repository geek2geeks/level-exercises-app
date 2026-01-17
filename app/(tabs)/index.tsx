import { useStores } from '@shared/stores/setup';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default observer(function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { authStore } = useStores();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      {/* Header */}
      <Animated.View
        style={styles.header}
        entering={FadeIn.duration(600)}
      >
        <View style={styles.logoRowSmall}>
          <Text style={styles.logoTextSmall}>L</Text>
          <View style={styles.logoBoxSmall}>
            <Text style={styles.logoTextSmall}>E</Text>
            <Text style={[styles.logoTextSmall, styles.greenText]}>V</Text>
            <Text style={[styles.logoTextSmall, styles.invertedL]}>E</Text>
          </View>
          <Text style={[styles.logoTextSmall, styles.invertedL]}>L</Text>
        </View>
        <Text style={styles.subtitle}>Welcome back.</Text>
      </Animated.View>

      {/* User Card */}
      <Animated.View
        style={styles.card}
        entering={FadeInDown.delay(200).duration(600)}
      >
        <Text style={styles.email}>{authStore.email || 'Athlete'}</Text>
        <Text style={styles.status}>Ready to train</Text>
      </Animated.View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/signup')}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>START TRAINING</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/vision-test')}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>TEST VISION ENGINE</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={() => router.push('/benchmark')}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>BENCHMARK ENGINE</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Logout */}
      <Animated.View
        style={styles.footer}
        entering={FadeInDown.delay(600).duration(600)}
      >
        <TouchableOpacity
          onPress={() => authStore.logout()}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 24,
  },
  logoRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 8,
  },
  logoBoxSmall: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 2,
    gap: 2,
  },
  logoTextSmall: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  greenText: {
    color: '#CCFF00',
  },
  invertedL: {
    transform: [{ scaleX: -1 }],
  },
  subtitle: {
    color: '#A0A0A0',
    fontSize: 28,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  card: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
  },
  email: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  status: {
    color: '#CCFF00',
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  actionsContainer: {
    flex: 1,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#CCFF00',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: '#2A2A2A',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tertiaryButton: {
    backgroundColor: '#1A1A1A',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    alignItems: 'center',
    borderRadius: 28,
  },
  logoutText: {
    color: '#A0A0A0',
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    letterSpacing: 1,
  },
});
