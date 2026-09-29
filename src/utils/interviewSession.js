/**
 * interviewSession.js
 *
 * Thin helpers for persisting the candidate's interview session data
 * (token, interview_id, candidate_name, etc.) in sessionStorage.
 *
 * WHY sessionStorage?
 *  - React Router clears location.state on F5 / direct URL navigation.
 *  - sessionStorage is scoped to the browser tab, so it won't leak between
 *    separate candidate sessions opened in different tabs.
 *
 * USAGE:
 *  SessionHandler   → saveInterviewSession(state)    (write once, at the root)
 *  Any other page   → getInterviewSession()           (read as fallback)
 *  Submission page  → clearInterviewSession()         (clean up on finish)
 */

const SESSION_KEY = 'dwani_interview_state';

/**
 * Persist the full interviewState object to sessionStorage.
 * Only writes when the state contains a valid session token.
 */
export function saveInterviewSession(state) {
  if (!state?.interview_session_token) return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save interview session to sessionStorage', e);
  }
}

/**
 * Read the persisted interviewState from sessionStorage.
 * Returns an empty object if nothing is stored or parsing fails.
 */
export function getInterviewSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Remove the persisted interviewState from sessionStorage.
 * Call this when the interview is fully complete so the token
 * doesn't bleed into a future session.
 */
export function clearInterviewSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.warn('Failed to clear interview session from sessionStorage', e);
  }
}

/**
 * Convenience: merge location.state with sessionStorage fallback.
 * location.state takes priority (it's freshest); sessionStorage is
 * used only when state is missing (page refresh / direct URL).
 *
 * @param {object|null} locationState  – value of useLocation().state
 * @returns {object} resolved interviewState
 */
export function resolveInterviewState(locationState) {
  const fromNav = locationState || {};
  if (fromNav.interview_session_token) return fromNav;
  return getInterviewSession();
}
