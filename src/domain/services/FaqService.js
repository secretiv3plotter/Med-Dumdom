// FaqService
// Role:
// Own FAQ search and suggestion logic for help and support.
// FAQs can be stored as app data, Realm data, or fetched from a later source,
// but the search behavior should live here, not in the UI.
//
// What belongs here:
// - returning all FAQs
// - searching FAQs by question keywords
// - ranking or filtering suggested FAQs based on a typed question
// - matching FAQ categories or tags
// - returning a safe fallback when nothing matches
//
// Use cases covered:
// - patient goes to help and support and searches or scrolls FAQs
// - patient enters a question and gets suggested FAQs
// - caregiver goes to help and support and searches or scrolls FAQs
//
// What should NOT belong here:
// - FAQ screen rendering
// - Realm schema definitions
// - internet fetching details unless a separate adapter handles it
// - user account or role mutation
//
// Suggested service methods:
// - getAllFaqs()
// - searchFaqs(query)
// - getSuggestedFaqs(question)
// - getFaqById(faqId)
// - getFaqCategories()
//
// Notes:
// - if FAQs are stored in Realm later, this service should still only expose search and retrieval
//
// Dependencies:
// - direct dependencies: none
// - commonly used by: help/support screens, FAQ search UI

const DEFAULT_FAQS = [
  {
    faqId: 'profile-update',
    category: 'Profile',
    tags: ['profile', 'personal information', 'name', 'contact'],
    question: 'How do I update my personal information?',
    answer: 'Go to the Profile section from the dashboard to update your name, contact number, or health details.',
  },
  {
    faqId: 'password-change',
    category: 'Account',
    tags: ['password', 'account', 'security'],
    question: 'How can I change my password?',
    answer: 'Open Settings, choose Password Change, enter your current and new password, then tap Change Password.',
  },
  {
    faqId: 'notifications',
    category: 'Settings',
    tags: ['notifications', 'reminders', 'alerts'],
    question: 'Where can I manage notifications?',
    answer: 'Go to Settings and select Notifications to adjust reminder alerts and app updates.',
  },
  {
    faqId: 'support-contact',
    category: 'Support',
    tags: ['help', 'support', 'contact'],
    question: 'How do I contact support?',
    answer: 'Use the Help and Support section and send your issue details so our team can assist you.',
  },
];

const normalizeFaqId = (value) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  throw new TypeError('faqId must be a non-empty string or a finite number.');
};

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
};

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.map((tag) => normalizeText(tag).toLowerCase()).filter(Boolean);
};

const normalizeFaq = (faq, index) => {
  if (!faq || typeof faq !== 'object') {
    throw new TypeError('Each FAQ must be an object.');
  }

  const normalizedFaq = {
    faqId: normalizeFaqId(faq.faqId ?? `faq-${index + 1}`),
    category: normalizeText(faq.category || 'General') || 'General',
    tags: normalizeTags(faq.tags),
    question: normalizeText(faq.question),
    answer: normalizeText(faq.answer),
  };

  if (!normalizedFaq.question || !normalizedFaq.answer) {
    throw new RangeError('FAQ question and answer cannot be empty.');
  }

  return normalizedFaq;
};

const scoreFaqMatch = (faq, query) => {
  if (!query) {
    return 1;
  }

  const q = query.toLowerCase();
  let score = 0;

  if (faq.question.toLowerCase() === q) {
    score += 100;
  }

  if (faq.question.toLowerCase().includes(q)) {
    score += 50;
  }

  if (faq.answer.toLowerCase().includes(q)) {
    score += 20;
  }

  if (faq.category.toLowerCase().includes(q)) {
    score += 15;
  }

  score += faq.tags.reduce((total, tag) => (tag.includes(q) ? total + 10 : total), 0);
  return score;
};

const cloneFaq = (faq) => ({
  faqId: faq.faqId,
  category: faq.category,
  tags: [...faq.tags],
  question: faq.question,
  answer: faq.answer,
});

export class FaqService {
  constructor(faqs = DEFAULT_FAQS) {
    const sourceFaqs = Array.isArray(faqs) ? faqs : DEFAULT_FAQS;
    this.faqs = sourceFaqs.map(normalizeFaq);
  }

  getAllFaqs() {
    return this.faqs.map(cloneFaq);
  }

  searchFaqs(query) {
    const normalizedQuery = normalizeText(query);
    const matchedFaqs = this.faqs
      .map((faq) => ({ faq, score: scoreFaqMatch(faq, normalizedQuery) }))
      .filter(({ score }) => score > 0)
      .sort((first, second) => {
        if (second.score !== first.score) {
          return second.score - first.score;
        }

        return first.faq.question.localeCompare(second.faq.question);
      });

    return matchedFaqs.map(({ faq }) => cloneFaq(faq));
  }

  getSuggestedFaqs(question) {
    const normalizedQuestion = normalizeText(question);
    if (!normalizedQuestion) {
      return this.getAllFaqs().slice(0, 3);
    }

    return this.searchFaqs(normalizedQuestion).slice(0, 3);
  }

  getFaqById(faqId) {
    const normalizedFaqId = normalizeFaqId(faqId);
    const faq = this.faqs.find((item) => item.faqId === normalizedFaqId);
    return faq ? cloneFaq(faq) : null;
  }

  getFaqCategories() {
    return [...new Set(this.faqs.map((faq) => faq.category))];
  }
}

const faqService = new FaqService();

export default faqService;
