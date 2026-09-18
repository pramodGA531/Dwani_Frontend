import { useState, useEffect } from 'react';
import { interviews as interviewService } from '../api';

export const useResults = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const interviewId = localStorage.getItem('interview_id');
    const token = localStorage.getItem('interview_session_token');
    interviewService
      .getResults(interviewId, token)
      .then((data) => {
        const strengthsList = data.strengths
          ? data.strengths.split(/[.,;\n]+/).map((s) => s.trim()).filter(Boolean)
          : [];
        const weaknessesList = data.weaknesses
          ? data.weaknesses.split(/[.,;\n]+/).map((s) => s.trim()).filter(Boolean)
          : [];
        setResults({
          candidateName: data.candidate_name || localStorage.getItem('candidate_name') || 'Candidate',
          role: data.job_title || localStorage.getItem('job_title') || 'Position',
          overallScore: Math.round(data.overall_score || 0),
          responses: (data.responses || []).map((r) => ({
            question: r.question,
            answer: r.answer,
            scores: {
              relevance: r.relevance_score,
              accuracy: r.accuracy_score,
              clarity: r.clarity_score,
            },
          })),
          strengths: strengthsList,
          improvements: weaknessesList,
          hiringSignal: data.recommendation || 'Under Review',
          overallSummary: null,
          confidence: data.confidence || 'High',
          clarity: data.clarity || 'Exceptional',
          responseTime: data.response_time || 'Optimal',
          behavioral: data.behavioral || {},
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load results:', err);
        setError(`Results error: ${err.message || 'unknown'}`);
        setLoading(false);
      });
  }, []);

  return { results, loading, error };
};
