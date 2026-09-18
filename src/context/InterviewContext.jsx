import React, { createContext, useContext, useState } from 'react';
import { interviews as interviewService } from '../api';
import { MOCK_INTERVIEW_QUESTIONS } from '../api/mockData';

const InterviewContext = createContext(null);

export const InterviewProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);

  const startInterview = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('interview_session_token');
      if (!token) {
        console.warn("No session token found. Initialising mock interview flow.");
        setQuestions(MOCK_INTERVIEW_QUESTIONS);
        setCurrentIndex(0);
        setAnswers({});
        setIsComplete(false);
        return;
      }

      const data = await interviewService.startInterview(token);
      
      const loadedQuestions = data.questions || [];
      setQuestions(loadedQuestions);
      if (data.num_questions) {
        setNumQuestions(data.num_questions);
      }
      
      // If the interview is already completed, mark it
      if (data.status === 'completed') {
        setIsComplete(true);
        setCurrentIndex(loadedQuestions.length > 0 ? loadedQuestions.length - 1 : 0);
      } else {
        // Resume at the latest unanswered question
        setCurrentIndex(loadedQuestions.length > 0 ? loadedQuestions.length - 1 : 0);
        setIsComplete(false);
      }
      setAnswers(data.answers || {});
    } catch (error) {
      console.error('Failed to start interview:', error);
      setQuestions(MOCK_INTERVIEW_QUESTIONS);
      setCurrentIndex(0);
      setAnswers({});
      setIsComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (questionId, transcript, forceFinish = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('interview_session_token');
      const currentQ = questions[currentIndex];
      
      // Save the answer locally
      setAnswers(prev => ({ ...prev, [currentIndex]: transcript }));

      if (!token) {
        // Mock mode progression:
        // Move to next mock question or finish after numQuestions
        const nextIndex = currentIndex + 1;
        if (nextIndex >= Math.min(questions.length, numQuestions)) {
          setIsComplete(true);
        } else {
          setCurrentIndex(nextIndex);
        }
        return;
      }

      const interviewId = localStorage.getItem('interview_id');

      // Send to backend for Groq evaluation and next question generation
      const data = await interviewService.submitAnswer(
        interviewId, 
        currentQ.text, 
        transcript, 
        currentIndex,
        token,
        forceFinish
      );

      if (data.is_complete || forceFinish) {
        // Store interview_id for results page (backend returns it on completion)
        if (data.interview_id) {
          localStorage.setItem('interview_id', data.interview_id);
        }
        setIsComplete(true);
      } else if (data.next_question) {
        // Append the new dynamically generated question to the array
        setQuestions(prev => [
          ...prev, 
          { text: data.next_question, index: data.index }
        ]);
        setCurrentIndex(data.index);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      // Fallback in case of API error, allow user to move forward locally
      const nextIndex = currentIndex + 1;
      if (nextIndex >= Math.min(questions.length, numQuestions)) {
        setIsComplete(true);
      } else {
        setCurrentIndex(nextIndex);
      }
    } finally {
      setLoading(false);
    }
  };

  // We no longer strictly need nextQuestion as submitAnswer handles the flow,
  // but we keep it empty to not break existing UI imports
  const nextQuestion = () => {};

  const value = {
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex],
    answers,
    isComplete,
    loading,
    numQuestions,
    startInterview,
    submitAnswer,
    nextQuestion
  };

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>;
};

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};
