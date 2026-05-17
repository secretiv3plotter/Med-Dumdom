import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../../../shared/components/common/BackButton';
import {
  BACK_HEADER_BOTTOM_PADDING,
  BACK_HEADER_HORIZONTAL_PADDING,
  BACK_HEADER_TOP_OFFSET,
} from '../../../shared/components/common/backHeaderMetrics';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import InputBar from '../../../shared/components/common/InputBar';
import TextCard from '../../../shared/components/common/TextCard';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import useScrollAwareFooterNav from '../../../shared/components/common/useScrollAwareFooterNav';
import faqService from '../../../domain/services/FaqService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { useTextScale } from '../../../shared/theme/textScale';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};
const HELP_CATEGORY_LABELS = ['Account', 'Meds', 'Appts.', 'Settings'];
const HELP_CATEGORY_VALUE_MAP = {
  Account: 'Account',
  Meds: 'Meds',
  'Appts.': 'Appts',
  Settings: 'Settings',
};
const APPOINTMENT_GREEN = colors.success;
const APPOINTMENT_GREEN_SOFT = colors.brandSoft;
export default function HelpAndSupportScreen({ navigation }) {
  const returnRoute = navigation?.currentParams?.returnTo || ROUTES.HOME;
  const { textScale } = useTextScale();
  const pinHeader = textScale < 1.5;
  const footerNav = useScrollAwareFooterNav();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Account');

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const { results } = useMemo(() => {
    const normalizedQuery = searchTerm.trim();
    const selectedCategoryValue = HELP_CATEGORY_VALUE_MAP[selectedCategory] || '';
    const faqsByCategory = faqService.getFaqsByCategory(selectedCategoryValue);
    const matchedFaqs = normalizedQuery
      ? (() => {
          const matchedIds = new Set(faqService.searchFaqs(normalizedQuery).map((faq) => faq.faqId));
          return faqsByCategory.filter((faq) => matchedIds.has(faq.faqId));
        })()
      : faqsByCategory;

    return {
      results: matchedFaqs,
    };
  }, [searchTerm, selectedCategory]);
  const isAppointmentsSelected = selectedCategory === 'Appts.';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.stickyTop, { backgroundColor: colors.pageBg }]}>
        <BackButton onPress={() => navigation?.navigate?.(returnRoute)} />
        {pinHeader ? (
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Help and Support</Text>
            <Text style={styles.subtitle}>Search the FAQ list or browse the supported categories.</Text>
          </View>
        ) : null}
      </View>

      <ThemedScrollView
        contentContainerStyle={styles.content}
        onLayout={footerNav.onLayout}
        onContentSizeChange={footerNav.onContentSizeChange}
        onScroll={footerNav.onScroll}
      >
        {!pinHeader ? (
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Help and Support</Text>
            <Text style={styles.subtitle}>Search the FAQ list or browse the supported categories.</Text>
          </View>
        ) : null}

        <InputBar
          placeholder="Search FAQs"
          accessibilityLabel="Search FAQs"
          value={searchTerm}
          onChangeText={setSearchTerm}
          showSearchIcon
          autoComplete="off"
        />

        <View style={styles.categoryRow}>
          {HELP_CATEGORY_LABELS.map((category) => (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.categoryChip,
                selectedCategory === category ? styles.categoryChipActive : null,
                category === 'Appts.' && selectedCategory === category ? styles.apptsCategoryChipActive : null,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category ? styles.categoryChipTextActive : null,
                  category === 'Appts.' ? styles.apptsCategoryChipText : null,
                  category === 'Appts.' && selectedCategory === category ? styles.apptsCategoryChipTextActive : null,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.faqList}>
          {results.length ? (
            results.map((item) => (
              <View key={item.faqId} style={styles.faqCardWrap}>
                <View style={styles.questionIconWrap}>
                  <Ionicons
                    name="help-circle-outline"
                    size={24}
                    color={isAppointmentsSelected ? colors.success : colors.brandText}
                  />
                </View>
                <TextCard
                  title={item.question}
                  body={item.answer}
                  cardStyle={[styles.faqCard, isAppointmentsSelected ? styles.apptsFaqCard : null]}
                  titleStyle={[styles.faqQuestion, isAppointmentsSelected ? styles.apptsFaqQuestion : null]}
                  bodyStyle={styles.faqAnswer}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>No FAQs found</Text>
              <Text style={styles.emptyStateBody}>Try a different search keyword in {selectedCategory}.</Text>
            </View>
          )}
        </View>
      </ThemedScrollView>

      <View
        pointerEvents={footerNav.isVisible ? 'auto' : 'none'}
        style={[
          styles.footerNav,
          { backgroundColor: colors.pageBg, opacity: footerNav.isVisible ? 1 : 0 },
        ]}
      >
        <NavigationBar
          selectedTab="home"
          showPressAlert={false}
          onNavigate={onTabNavigate}
          hidden={!footerNav.isVisible}
        />
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
    paddingTop: spacing.sm,
    paddingBottom: 150,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.title,
    textAlign: 'left',
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
    textAlign: 'left',
  },
  headerBlock: {
    alignItems: 'flex-start',
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
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  categoryChipText: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: colors.brandText,
  },
  apptsCategoryChipText: {
    color: '#000000',
  },
  apptsCategoryChipTextActive: {
    color: '#000000',
  },
  apptsCategoryChipActive: {
    borderColor: APPOINTMENT_GREEN,
    backgroundColor: APPOINTMENT_GREEN_SOFT,
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
    borderRadius: radius.lg,
    paddingLeft: 52,
    paddingRight: spacing.md,
  },
  faqQuestion: {
    ...typography.bodySmall,
    color: colors.brandText,
    fontWeight: '700',
  },
  faqAnswer: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  apptsFaqCard: {
    borderColor: APPOINTMENT_GREEN,
    backgroundColor: APPOINTMENT_GREEN_SOFT,
  },
  apptsFaqQuestion: {
    color: '#000000',
  },
  emptyStateCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xs,
  },
  emptyStateTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  emptyStateBody: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  stickyTop: {
    backgroundColor: colors.pageBg,
    paddingHorizontal: BACK_HEADER_HORIZONTAL_PADDING,
    paddingTop: BACK_HEADER_TOP_OFFSET,
    paddingBottom: BACK_HEADER_BOTTOM_PADDING,
    gap: spacing.xs,
  },
});
