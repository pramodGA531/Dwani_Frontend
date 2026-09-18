import React, { useState, useEffect } from 'react';
import { Check, Star } from 'lucide-react';
import api from '../api/client';

const submissionStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .sub-page {
    min-height: 100vh;
    background: #F8F9FB;
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
  }

  .sub-card {
    width: 100%;
    max-width: 560px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Success Hero */
  .sub-hero {
    background: #ffffff;
    border: 1px solid #E2E8F0;
    border-radius: 24px;
    padding: 48px 40px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .sub-check-ring {
    width: 72px;
    height: 72px;
    background: linear-gradient(135deg, #2563EB, #1D4ED8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    box-shadow: 0 8px 20px rgba(37,99,235,0.3);
  }
  .sub-title {
    font-size: 26px;
    font-weight: 800;
    color: #0F172A;
    margin: 0 0 12px;
    letter-spacing: -0.02em;
  }
  .sub-desc {
    font-size: 15px;
    color: #64748B;
    line-height: 1.7;
    margin: 0;
  }

  /* Review Card */
  .review-card {
    background: #ffffff;
    border: 1px solid #E2E8F0;
    border-radius: 24px;
    padding: 36px 40px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .review-title {
    font-size: 17px;
    font-weight: 800;
    color: #0F172A;
    margin: 0 0 4px;
  }
  .review-sub {
    font-size: 13px;
    color: #94A3B8;
    margin: 0 0 28px;
  }
  .divider {
    height: 1px;
    background: #F1F5F9;
    margin-bottom: 28px;
  }

  .rating-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .rating-label {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
  }
  .stars {
    display: flex;
    gap: 4px;
  }
  .star {
    cursor: pointer;
    color: #CBD5E1;
    transition: color 0.15s, transform 0.1s;
  }
  .star:hover, .star.filled {
    color: #F59E0B;
  }
  .star:hover {
    transform: scale(1.15);
  }

  .comment-label {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 10px;
  }
  .comment-textarea {
    width: 100%;
    min-height: 100px;
    border: 1.5px solid #E2E8F0;
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    color: #334155;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  .comment-textarea:focus {
    border-color: #2563EB;
  }
  .char-counter {
    font-size: 11px;
    color: #94A3B8;
    text-align: right;
    margin-top: 6px;
  }

  .submit-btn {
    width: 100%;
    padding: 15px;
    background: #2563EB;
    color: #fff;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 24px;
    transition: background 0.2s, transform 0.1s;
    box-shadow: 0 4px 12px rgba(37,99,235,0.2);
  }
  .submit-btn:hover:not(:disabled) {
    background: #1D4ED8;
    transform: translateY(-1px);
  }
  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Thank You State */
  .thankyou-state {
    text-align: center;
    padding: 20px 0 4px;
  }
  .thankyou-icon {
    width: 52px;
    height: 52px;
    background: #F0FDF4;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }
  .thankyou-title {
    font-size: 18px;
    font-weight: 800;
    color: #0F172A;
    margin-bottom: 6px;
  }
  .thankyou-sub {
    font-size: 14px;
    color: #64748B;
  }

  .sub-footer {
    text-align: center;
    font-size: 12px;
    color: #CBD5E1;
    font-weight: 500;
  }
`;

const categories = [
  { key: 'overall_experience', label: 'Overall Experience' },
  { key: 'ai_clarity',         label: 'AI Clarity' },
  { key: 'ease_of_use',        label: 'Ease of Use' },
  { key: 'technical_stability',label: 'Technical Stability' },
];

const Submission = () => {
  const [ratings, setRatings] = useState({
    overall_experience: 0,
    ai_clarity: 0,
    ease_of_use: 0,
    technical_stability: 0,
  });
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [greetingMessage, setGreetingMessage] = useState('');

  // Automatically play thank you / farewell greeting via TTS when landing on submission
  useEffect(() => {
    const candidateName = localStorage.getItem('candidate_name') || '';
    const firstName = candidateName ? candidateName.split(' ')[0] : '';
    
    // Warm and professional greeting template
    const msg = `Thank you so much${firstName ? `, ${firstName}` : ''}! You have successfully completed your interview. Your responses have been securely transmitted to our evaluation team. We really appreciate your time and effort today. We will review everything and get back to you with next steps shortly. Have a wonderful day!`;
    
    setGreetingMessage(msg);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Clear any queued speech
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleRating = (key, value) => setRatings(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const token = localStorage.getItem('interview_session_token');
    
    if (!token) {
      // Mock flow simulation
      console.log("Mock review submission captured locally:", { ratings, comment });
      setTimeout(() => {
        setSubmitted(true);
        setSubmitting(false);
      }, 500);
      return;
    }

    const interviewId = localStorage.getItem('interview_id');
    try {
      await api.post('/v1/interviews/submit-review/', {
        interview_id: interviewId,
        token: token,
        ...ratings,
        comment,
      });
      setSubmitted(true);
    } catch (err) {
      console.warn('Review API submission failed, falling back to local submission:', err);
      // Fallback so candidate is not stuck after completing their interview
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sub-page">
      <style>{submissionStyles}</style>
      <div className="sub-card">

        {/* Success Hero */}
        <div className="sub-hero">
          <div className="sub-check-ring">
            <Check size={32} color="#fff" strokeWidth={3} />
          </div>
          <h1 className="sub-title">Interview Submitted Successfully!</h1>
          <p className="sub-desc">
            Your responses have been securely transmitted to our evaluation team.
            You will receive a notification once the review process is complete.
          </p>
          {greetingMessage && (
            <p className="sub-desc" style={{ fontStyle: 'italic', color: '#1E293B', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px 20px', borderRadius: '16px', marginTop: '20px', textAlign: 'left', lineHeight: '1.6' }}>
              "{greetingMessage}"
            </p>
          )}
        </div>

        {/* Review Form */}
        <div className="review-card">
          {!submitted ? (
            <>
              <div className="review-title">How was your experience?</div>
              <div className="review-sub">Your feedback helps us improve.</div>
              <div className="divider" />

              {categories.map(({ key, label }) => (
                <div className="rating-row" key={key}>
                  <span className="rating-label">{label}</span>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={22}
                        className={`star ${ratings[key] >= star ? 'filled' : ''}`}
                        fill={ratings[key] >= star ? '#F59E0B' : 'none'}
                        stroke={ratings[key] >= star ? '#F59E0B' : '#CBD5E1'}
                        onClick={() => handleRating(key, star)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <label className="comment-label" style={{ marginTop: 8 }}>Additional Comments</label>
              <textarea
                className="comment-textarea"
                placeholder="Share any thoughts about your interview experience..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                maxLength={500}
              />
              <div className="char-counter">{comment.length}/500</div>

              {error && (
                <p style={{ color: '#DC2626', fontSize: 13, marginTop: 12, fontWeight: 600 }}>{error}</p>
              )}

              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </>
          ) : (
            <div className="thankyou-state">
              <div className="thankyou-icon">
                <Check size={24} color="#16A34A" strokeWidth={3} />
              </div>
              <div className="thankyou-title">Thank You for Your Feedback!</div>
              <p className="thankyou-sub">Your review has been recorded. Good luck!</p>
            </div>
          )}
        </div>

        <div className="sub-footer">© 2024 InterviewAI · All rights reserved</div>
      </div>
    </div>
  );
};

export default Submission;
