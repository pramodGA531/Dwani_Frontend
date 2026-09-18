const USE_MOCK = true;
const MOCK_DELAY = 1000;

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export const feedback = {
  async submitFeedback(feedbackData) {
    if (USE_MOCK) {
      console.log('Submitting feedback:', feedbackData);
      await delay(MOCK_DELAY);
      return { success: true };
    }
  }
};
