// attributes:

// faqId
// question
// answer
// category
// keywords

//constructor(...) that assigns those fields

class Faq {
  constructor(faqId, question, answer, category, keywords) {
    this.faqId = faqId;
    this.question = question;
    this.answer = answer;
    this.category = category;
    this.keywords = keywords;
  }
}

export default Faq;