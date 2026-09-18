import { MOCK_DASHBOARD_DATA } from './mockData';

const USE_MOCK = true;
const MOCK_DELAY = 800;

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export const dashboard = {
  async getDashboardData() {
    if (USE_MOCK) {
      await delay(MOCK_DELAY);
      return { ...MOCK_DASHBOARD_DATA };
    }
  }
};
