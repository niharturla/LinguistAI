
import React, { useState } from 'react';
import { QuizSet, QuizQuestion } from '../types';
import { Button } from './Button';

interface QuizComponentProps {
  quiz: QuizSet;
  onComplete: (score: number) => void;
  onRestart: () => void;
}

export const QuizComponent: React.FC<QuizComponentProps> = ({ quiz, onComplete, onRestart }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [useRomanized, setUseRomanized] = useState(false);

  const currentQuestion = quiz.questions[currentIndex];
  const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;

  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
    setShowFeedback(true);
    if (index === currentQuestion.correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      onComplete(score + (isCorrect ? 1 : 0));
    }
  };

  return (
    <div className="animate-slide bg-white rounded-3xl p-8 shadow-xl border border-slate-100 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onRestart}
          className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 font-bold text-xs transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          EXIT
        </button>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase text-slate-400">Options Script</span>
          <button 
            onClick={() => setUseRomanized(!useRomanized)}
            className="flex items-center bg-slate-100 p-1 rounded-full w-24 h-8 relative transition-all"
            title="Toggle options between native script and Romanized version"
          >
            <div className={`absolute w-12 h-6 bg-white rounded-full shadow-sm transition-transform flex items-center justify-center text-[10px] font-bold text-indigo-600 ${useRomanized ? 'translate-x-10' : 'translate-x-0'}`}>
              {useRomanized ? 'ABC' : 'あ/अ'}
            </div>
            <div className="flex w-full justify-between px-2 text-[8px] font-bold text-slate-400 pointer-events-none">
              <span>NATIVE</span>
              <span>ROMAN</span>
            </div>
          </button>
        </div>

        <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-500">
          {currentIndex + 1} / {quiz.questions.length}
        </span>
      </div>

      <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-indigo-600 h-full transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-2">
          {quiz.topic} ({quiz.difficulty})
        </h3>
        <h2 className="text-xl font-bold text-slate-800 leading-tight">
          {currentQuestion.question}
        </h2>
        <p className="text-[10px] text-slate-400 uppercase mt-2 font-bold tracking-tighter">Question is in English</p>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-8">
        {currentQuestion.options.map((option, idx) => {
          const displayOption = useRomanized ? currentQuestion.optionsTransliteration[idx] : option;
          let styles = "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700";
          if (showFeedback) {
            if (idx === currentQuestion.correctAnswerIndex) styles = "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20";
            else if (idx === selectedOption) styles = "border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20";
            else styles = "border-slate-100 opacity-50 text-slate-400";
          } else if (selectedOption === idx) {
            styles = "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20";
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionSelect(idx)}
              disabled={showFeedback}
              className={`p-4 rounded-2xl border-2 font-semibold text-left transition-all group flex justify-between items-center ${styles}`}
            >
              <span>{displayOption}</span>
              {showFeedback && idx === currentQuestion.correctAnswerIndex && (
                 <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
              )}
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <div className={`p-5 rounded-2xl mb-8 animate-slide ${isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
          <div className="font-bold mb-1">{isCorrect ? 'Correct!' : 'Not quite...'}</div>
          <p className="text-sm opacity-90">{currentQuestion.explanation}</p>
          <div className="mt-3 text-[10px] font-bold uppercase opacity-50">
            {useRomanized ? "Tip: Switch to native script to practice recognition" : "Tip: Use Romanized toggle for help with reading options"}
          </div>
        </div>
      )}

      {showFeedback && (
        <Button onClick={nextQuestion} className="w-full py-4 text-lg">
          {currentIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
        </Button>
      )}
    </div>
  );
};
