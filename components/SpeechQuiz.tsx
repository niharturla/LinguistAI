
import React, { useState } from 'react';
import { SpeechChallenge, SpeechEvaluation } from '../types';
import { Button } from './Button';

interface SpeechQuizProps {
  challenge: SpeechChallenge;
  onEvaluate: (transcript: string) => Promise<void>;
  onPlayNative: () => void;
  evaluation: SpeechEvaluation | null;
  isLoading: boolean;
  onNewChallenge: () => void;
  isSpeaking: boolean;
}

export const SpeechQuiz: React.FC<SpeechQuizProps> = ({ 
  challenge, 
  onEvaluate, 
  onPlayNative,
  evaluation, 
  isLoading, 
  onNewChallenge,
  isSpeaking
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support speech recognition.");
      return;
    }

    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = challenge.targetLanguage === 'en' ? 'en-US' : challenge.targetLanguage;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      onEvaluate(result);
    };

    recognition.start();
  };

  return (
    <div className="animate-slide flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-500">Speech Challenge</span>
          <Button variant="ghost" onClick={onNewChallenge} className="text-xs">Skip / New</Button>
        </div>
        
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">"{challenge.phraseToSpeak}"</h2>
          <p className="text-slate-400 font-medium text-lg italic">{challenge.translation}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            variant="secondary" 
            onClick={onPlayNative} 
            disabled={isSpeaking}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl"
          >
            <svg className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
            Listen to Native
          </Button>

          <button 
            onClick={handleListen}
            disabled={isListening || isLoading || !!evaluation}
            className={`flex flex-col items-center justify-center w-24 h-24 rounded-full transition-all shadow-xl ${isListening ? 'bg-rose-500 text-white animate-pulse scale-110' : evaluation ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            <span className="text-[10px] font-bold uppercase mt-1 tracking-tighter">{isListening ? 'Recording' : 'Record'}</span>
          </button>
        </div>

        {transcript && (
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">You said:</h4>
            <p className="text-xl font-bold text-slate-700">"{transcript}"</p>
          </div>
        )}
      </div>

      {evaluation && (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-indigo-100 animate-slide">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800">Evaluation</h3>
            <div className={`px-6 py-2 rounded-full font-black text-2xl ${evaluation.score > 80 ? 'bg-emerald-100 text-emerald-700' : evaluation.score > 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
              {evaluation.score}%
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Accuracy</h4>
                <p className="text-slate-600 leading-relaxed font-medium">{evaluation.accuracyFeedback}</p>
              </section>
              <section>
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Flow & Naturalness</h4>
                <p className="text-slate-600 leading-relaxed font-medium">{evaluation.naturalness}</p>
              </section>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-bold uppercase text-indigo-500 mb-4 tracking-widest">Pronunciation Tips</h4>
              <p className="text-slate-700 leading-relaxed">{evaluation.pronunciationTips}</p>
            </div>
          </div>
          
          <Button variant="primary" onClick={onNewChallenge} className="w-full mt-8 py-4 rounded-2xl">Try Another Phrase</Button>
        </div>
      )}
    </div>
  );
};
