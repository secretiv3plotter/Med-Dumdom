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
// - patient goes to help and support and searches or scrolls FAQs
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
    category: 'Account',
    tags: ['profile', 'personal information', 'name', 'birth date', 'address'],
    question: 'How do I update my personal information?',
    answer: 'Open My Profile from the dashboard, tap Edit, update your full name, birth date, or address, then tap Save and confirm.',
  },
  {
    faqId: 'password-change',
    category: 'Account',
    tags: ['password', 'account', 'security'],
    question: 'How can I change my password?',
    answer: 'Open Settings, enter your current password and new password in Password Change, tap Change Password, then confirm.',
  },
  {
    faqId: 'account-profile-picture-url',
    category: 'Account',
    tags: ['profile picture', 'avatar', 'photo', 'image'],
    question: 'Can I change my profile picture?',
    answer: 'Yes. Open My Profile, choose Change Picture, allow photo library access if asked, select an image, then save it.',
  },
  {
    faqId: 'meds-add-medicine',
    category: 'Meds',
    tags: ['add medicine', 'new medication', 'tracker'],
    question: 'How do I add a medicine to my tracker?',
    answer: 'Open Med Tracker, tap the add button, complete medicine details, choose a schedule type, add schedule items, then save.',
  },
  {
    faqId: 'meds-schedule-types',
    category: 'Meds',
    tags: ['schedule', 'daily', 'hourly', 'weekly', 'monthly'],
    question: 'What medication schedules can I use?',
    answer: 'The app supports hourly, daily, weekly, and monthly medication schedules.',
  },
  {
    faqId: 'meds-mark-status',
    category: 'Meds',
    tags: ['taken', 'skipped', 'status', 'dose'],
    question: 'How do I mark a dose as taken or skipped?',
    answer: 'Open a medicine or use the list controls, then set each schedule item status to taken or skipped. You can also clear or change a status.',
  },
  {
    faqId: 'meds-custom-unit',
    category: 'Meds',
    tags: ['unit', 'mg', 'capsule', 'custom'],
    question: 'Can I add my own medicine unit?',
    answer: 'Yes. While editing a medicine, you can add a custom unit if mg or capsule does not match your prescription.',
  },
  {
    faqId: 'meds-history',
    category: 'Meds',
    tags: ['history', 'records', 'previous records', 'past medicine', 'medicine history'],
    question: 'Where can I review previous medicine records?',
    answer: 'In Med Tracker, tap Review previous records to open your medicine schedule history.',
  },
  {
    faqId: 'appts-add-appointment',
    category: 'Appts',
    tags: ['appointment', 'add', 'schedule'],
    question: 'How do I add an appointment?',
    answer: 'Open Appointments, tap the add button, enter concern and address, then set a valid date and time and save.',
  },
  {
    faqId: 'appts-mark-complete-skip',
    category: 'Appts',
    tags: ['completed', 'skipped', 'status', 'revert'],
    question: 'Can I mark an appointment as done or skipped?',
    answer: 'Yes. Open the appointment details and set the status to done or skipped. You can revert it back to pending.',
  },
  {
    faqId: 'appts-edit-delete',
    category: 'Appts',
    tags: ['edit', 'delete', 'appointment details'],
    question: 'How do I edit or delete an appointment?',
    answer: 'Select an appointment, open details, then use Edit to update fields or Delete to remove it from your tracker.',
  },
  {
    faqId: 'appts-history',
    category: 'Appts',
    tags: ['history', 'records', 'past appointments'],
    question: 'Where can I review previous appointment records?',
    answer: 'In the Appointments screen, tap Review previous records to open your appointment history.',
  },
  {
    faqId: 'settings-accessibility',
    category: 'Settings',
    tags: ['accessibility', 'text size', 'contrast', 'dark mode', 'haptic', 'color blind'],
    question: 'What can I customize in Accessibility Settings?',
    answer: 'You can adjust text size and toggle high contrast, haptic feedback, color blind mode, and dark mode. On web, haptic feedback only works on devices and browsers that support vibration.',
  },
  {
    faqId: 'settings-delete-account',
    category: 'Settings',
    tags: ['delete account', 'deactivate', 'reactivate', 'recover', 'sign out'],
    question: 'What happens when I delete my account?',
    answer: 'The app marks your account as deleted, records when it was deleted, and signs you out. If you need access again, the account can be reactivated later.',
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

  getFaqsByCategory(category) {
    const normalizedCategory = normalizeText(category).toLowerCase();

    if (!normalizedCategory) {
      return this.getAllFaqs();
    }

    return this.faqs
      .filter((faq) => faq.category.toLowerCase() === normalizedCategory)
      .map(cloneFaq);
  }
}

const faqService = new FaqService();

export default faqService;
