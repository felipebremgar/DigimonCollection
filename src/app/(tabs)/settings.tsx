import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTranslation } from '@/i18n/use-translation';
import { usePreferences, type ThemePreference } from '@/preferences/preferences';
import type { Language } from '@/i18n/translations';
import { useTheme } from '@/hooks/use-theme';

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress}>
      <ThemedView type="backgroundElement" style={styles.option}>
        <ThemedText type="default">{label}</ThemedText>
        {selected && <ThemedText style={{ color: theme.text }}>✓</ThemedText>}
      </ThemedView>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const prefs = usePreferences();

  const languages: { value: Language; label: string }[] = [
    { value: 'pt', label: 'Português' },
    { value: 'en', label: 'English' },
  ];
  const themes: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.content}>
        <ThemedText type="subtitle">{t('settings.title')}</ThemedText>

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {t('settings.language').toUpperCase()}
          </ThemedText>
          {languages.map((l) => (
            <OptionRow
              key={l.value}
              label={l.label}
              selected={prefs.language === l.value}
              onPress={() => prefs.setLanguage(l.value)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {t('settings.theme').toUpperCase()}
          </ThemedText>
          {themes.map((th) => (
            <OptionRow
              key={th.value}
              label={th.label}
              selected={prefs.themePreference === th.value}
              onPress={() => prefs.setThemePreference(th.value)}
            />
          ))}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16, gap: 20 },
  section: { gap: 8 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
  },
});
