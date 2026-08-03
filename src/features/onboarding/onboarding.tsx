import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTranslation } from '@/i18n/use-translation';
import { useTheme } from '@/hooks/use-theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Onboarding de primeiro uso (Etapa 18): apresenta as três áreas do app. */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const features: { icon: IoniconName; title: string; body: string }[] = [
    { icon: 'library', title: t('onboarding.slide1.title'), body: t('onboarding.slide1.body') },
    { icon: 'albums', title: t('onboarding.slide2.title'), body: t('onboarding.slide2.body') },
    { icon: 'heart', title: t('onboarding.slide3.title'), body: t('onboarding.slide3.body') },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.welcome}>
            {t('onboarding.welcome')}
          </ThemedText>

          <View style={styles.features}>
            {features.map((feature) => (
              <View key={feature.icon} style={styles.feature}>
                <Ionicons name={feature.icon} size={30} color={theme.text} />
                <View style={styles.featureText}>
                  <ThemedText type="default">{feature.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {feature.body}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Pressable style={[styles.button, { backgroundColor: theme.text }]} onPress={onDone}>
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            {t('onboarding.start')}
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, padding: 24 },
  content: { flex: 1, justifyContent: 'center', gap: 32 },
  welcome: { fontSize: 34, lineHeight: 40 },
  features: { gap: 22 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureText: { flex: 1, gap: 2 },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
