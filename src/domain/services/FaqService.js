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
