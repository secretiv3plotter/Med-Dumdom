import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../../../shared/components/common/BackButton';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import SearchBar from '../../../shared/components/common/SearchBar';
import TextCard from '../../../shared/components/common/TextCard';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, spacing, typography } from '../../../shared/theme';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

const FAQ_ITEMS = [
  {
    question: 'How do I update my personal information?',
    answer: 'Go to the Profile section from the dashboard to update your name, contact number, or health details.',
  },
  {
    question: 'How can I change my password?',
    answer: 'Open Settings, choose Password Change, enter your current and new password, then tap Change Password.',
  },
  {
    question: 'Where can I manage notifications?',
    answer: 'Go to Settings and select Notifications to adjust reminder alerts and app updates.',
  },
  {
    question: 'How do I contact support?',
    answer: 'Use the Help and Support section and send your issue details so our team can assist you.',
  },
];

export default function HelpAndSupportScreen({ navigation }) {
  const [searchTerm, setSearchTerm] = useState('');

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const filteredFaqItems = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    if (!normalizedQuery) {
      return FAQ_ITEMS;
    }

    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(normalizedQuery) ||
        item.answer.toLowerCase().includes(normalizedQuery),
    );
  }, [searchTerm]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <BackButton onPress={() => navigation?.goBack?.()} disabled={!navigation?.canGoBack} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBlock}>
          <View style={styles.titleRow}>
            <Ionicons name="help-circle" size={32} color="black" />
            <Text style={styles.title}>Help and Support</Text>
          </View>
          <Text style={styles.subtitle}>How can we help you today?</Text>
        </View>

        <SearchBar
          placeholder="Search"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />

        <View style={styles.faqList}>
          {filteredFaqItems.map((item, index) => (
            <View key={`${item.question}-${index}`} style={styles.faqCardWrap}>
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
    gap: spacing.sm,
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
