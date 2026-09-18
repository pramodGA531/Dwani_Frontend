import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare, ThumbsUp, Send, Shield, ChevronLeft } from 'lucide-react';

const fbStyles = `
  .fb-page {
    min-height: 100vh; background: #f8fafc;
    font-family: 'Inter', -apple-system, sans-serif;
    display: flex; flex-direction: column;
    color: #1e293b;
  }
  .fb-header {
    display: flex; align-items: center; padding: 16px 48px; background: #fff; border-bottom: 1px solid #e2e8f0;
    justify-content: space-between;
  }
  .fb-brand { font-weight: 800; font-size: 19px; color: #0f172a; display: flex; align-items: center; gap: 10px; }
  .fb-back-btn { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; border: none; background: none; }

  .fb-main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 64px 24px; }
  .fb-container { width: 100%; max-width: 600px; }

  .fb-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 48px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  .fb-title { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 8px; letter-spacing: -0.02em; }
  .fb-subtitle { font-size: 15px; color: #64748b; margin-bottom: 40px; }

  .fb-section { margin-bottom: 32px; }
  .fb-label { display: block; font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 16px; }
  
  .fb-stars { display: flex; gap: 12px; }
  .fb-star { cursor: pointer; transition: transform 0.2s; }
  .fb-star:hover { transform: scale(1.2); }

  .fb-tags { display: flex; flex-wrap: wrap; gap: 10px; }
  .fb-tag {
    padding: 10px 20px; border-radius: 12px; border: 1px solid #e2e8f0;
    font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s;
  }
  .fb-tag:hover { background: #f8fafc; border-color: #cbd5e1; }
  .fb-tag.active { background: #eff6ff; border-color: #2563EB; color: #2563EB; }

  .fb-textarea {
    width: 100%; min-height: 120px; padding: 16px 20px; border-radius: 16px;
    border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit;
    font-size: 14px; color: #1e293b; resize: none; outline: none; transition: all 0.2s;
  }
  .fb-textarea:focus { border-color: #2563EB; background: #fff; box-shadow: 0 0 0 4px rgba(37,99,235,0.05); }

  .fb-submit {
    width: 100%; height: 56px; background: #2563EB; color: #fff;
    font-weight: 700; font-size: 16px; border: none; border-radius: 14px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    gap: 12px; transition: all 0.2s; margin-top: 16px;
  }
  .fb-submit:hover { background: #1d4ed8; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
  
  .fb-success-view { text-align: center; }
  .fb-success-icon {
    width: 64px; height: 64px; background: #f0fdf4; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; color: #16a34a;
    margin: 0 auto 24px;
  }
`;

const Feedback = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const tags = ['Intuitive UI', 'Great AI', 'Clear Audio', 'Fast Loading', 'Smooth Process'];

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <div className="fb-page">
      <style>{fbStyles}</style>

      <header className="fb-header">
        <div className="fb-brand">
          <Shield size={20} color="#2563EB" strokeWidth={2.5} />
          <span>InterviewerAI</span>
        </div>
        <button className="fb-back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} /> Back to Submission
        </button>
      </header>

      <main className="fb-main">
        <div className="fb-container">
          <div className="fb-card">
            {!submitted ? (
              <>
                <h1 className="fb-title">Experience Feedback</h1>
                <p className="fb-subtitle">How would you rate your virtual interview today?</p>

                <form onSubmit={handleSubmit}>
                  <div className="fb-section">
                    <label className="fb-label">Overall Rating</label>
                    <div className="fb-stars">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          size={32}
                          fill={s <= rating ? "#FBBF24" : "none"}
                          color={s <= rating ? "#FBBF24" : "#cbd5e1"}
                          className="fb-star"
                          onClick={() => setRating(s)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="fb-section">
                    <label className="fb-label">What went well?</label>
                    <div className="fb-tags">
                      {tags.map(t => (
                        <button
                          key={t}
                          type="button"
                          className={`fb-tag ${selectedTags.includes(t) ? 'active' : ''}`}
                          onClick={() => toggleTag(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="fb-section">
                    <label className="fb-label">Additional Comments (Optional)</label>
                    <textarea
                      className="fb-textarea"
                      placeholder="Tell us more about your experience..."
                    />
                  </div>

                  <button type="submit" className="fb-submit">
                    Send Feedback
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="fb-success-view">
                <div className="fb-success-icon"><ThumbsUp size={32} /></div>
                <h2 className="fb-title">Thank You!</h2>
                <p className="fb-subtitle">Your feedback has been recorded. Redirecting...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Feedback;
