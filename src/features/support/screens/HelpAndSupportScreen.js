import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../../../shared/components/common/BackButton';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import SearchBar from '../../../shared/components/common/SearchBar';
import TextCard from '../../../shared/components/common/TextCard';
import faqService from '../../../domain/services/FaqService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, spacing, typography } from '../../../shared/theme';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

export default function HelpAndSupportScreen({ navigation }) {
  const [searchTerm, setSearchTerm] = useState('');

  const canGoBack =
    typeof navigation?.canGoBack === 'function'
      ? navigation.canGoBack()
      : Boolean(navigation?.canGoBack);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const { categories, results } = useMemo(() => {
    const normalizedQuery = searchTerm.trim();
    const matchedFaqs = normalizedQuery ? faqService.searchFaqs(normalizedQuery) : faqService.getAllFaqs();

    return {
      categories: faqService.getFaqCategories(),
      results: matchedFaqs,
    };
  }, [searchTerm]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <BackButton onPress={() => canGoBack && navigation?.goBack?.()} disabled={!canGoBack} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBlock}>
          <View style={styles.titleRow}>
            <Ionicons name="help-circle" size={32} color={colors.brandText} />
            <Text style={styles.title}>Help and Support</Text>
          </View>
          <Text style={styles.subtitle}>Search the FAQ list or browse the supported categories.</Text>
        </View>

        <SearchBar placeholder="Search FAQs" value={searchTerm} onChangeText={setSearchTerm} />

        <View style={styles.categoryRow}>
          {categories.map((category) => (
            <View key={category} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{category}</Text>
            </View>
          ))}
        </View>

        <View style={styles.faqList}>
          {results.map((item) => (
            <View key={item.faqId} style={styles.faqCardWrap}>
              <View style={styles.questionIconWrap}>
                <Ionicons name="help-circle-outline" size={24} color={colors.brandText} />
              </View>
              <TextCard
                title={item.question}
                body={item.answer}
                cardStyle={styles.faqCard}
                titleStyle={styles.faqQuestion}
                bodyStyle={styles.faqAnswer}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="home" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 84,
    paddingBottom: 150,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
    textAlign: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.surface,
  },
  categoryChipText: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '700',
  },
  faqList: {
    gap: spacing.md,
  },
  faqCardWrap: {
    position: 'relative',
  },
  questionIconWrap: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    zIndex: 2,
  },
  faqCard: {
    borderColor: colors.brand,
    backgroundColor: '#F4FAFF',
    borderRadius: 24,
    paddingLeft: 52,
    paddingRight: spacing.md,
  },
  faqQuestion: {
    ...typography.body,
    color: colors.brandText,
    fontWeight: '700',
  },
  faqAnswer: {
    ...typography.subtitle,
    color: colors.title,
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  stickyTop: {
    position: 'absolute',
    top: spacing.md + spacing.sm,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: spacing.lg,
  },
});
