
import React, { useState, useEffect } from 'react';
import { translateAndExplain, generateSpeech, generateQuiz, generateSpeechChallenge, evaluateSpeechInput } from './services/geminiService';
import { TranslationResult, HistoryItem, AppMode, QuizSet, QuizDifficulty, SpeechChallenge, SpeechEvaluation } from './types';
import { LANGUAGES, APP_NAME } from './constants';
import { LanguageSelector } from './components/LanguageSelector';
import { LinguisticInsight } from './components/LinguisticInsight';
import { Button } from './components/Button';
import { QuizComponent } from './components/QuizComponent';
import { SpeechQuiz } from './components/SpeechQuiz';
import { playPCM } from './utils/audio';

const QUIZ_TOPICS = [
  "Greetings & Basic Phrases",
  "Ordering Food & Drinks",
  "Travel & Directions",
  "Numbers & Telling Time",
  "Common Verbs & Grammar",
  "Shopping & Money"
];

const DIFF_LEVELS: QuizDifficulty[] = ['beginner', 'intermediate', 'advanced'];

export default function App() {
  const [mode, setMode] = useState<AppMode>('translate');
  const [sourceText, setSourceText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Quiz states
  const [activeQuiz, setActiveQuiz] = useState<QuizSet | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState(QUIZ_TOPICS[0]);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('beginner');

  // Speech states
  const [activeSpeechChallenge, setActiveSpeechChallenge] = useState<SpeechChallenge | null>(null);
  const [speechEvaluation, setSpeechEvaluation] = useState<SpeechEvaluation | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('linguist_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsLoading(true);
    setResult(null);
    try {
      const translationResult = await translateAndExplain(sourceText, sourceLang, targetLang);
      setResult(translationResult);
      
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        sourceText,
        targetText: translationResult.translatedText,
        sourceLang,
        targetLang,
        timestamp: Date.now(),
        result: translationResult
      };

      const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('linguist_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Translation error:", error);
      alert("Something went wrong with the translation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    setIsLoading(true);
    setActiveQuiz(null);
    setQuizScore(null);
    try {
      const langName = LANGUAGES.find(l => l.code === targetLang)?.name || 'Spanish';
      const quiz = await generateQuiz(langName, selectedTopic, difficulty);
      setActiveQuiz(quiz);
    } catch (error) {
      console.error("Quiz generation error:", error);
      alert("Failed to generate quiz. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSpeechQuiz = async () => {
    setIsLoading(true);
    setSpeechEvaluation(null);
    try {
      const langName = LANGUAGES.find(l => l.code === targetLang)?.name || 'Spanish';
      const challenge = await generateSpeechChallenge(langName, difficulty);
      setActiveSpeechChallenge(challenge);
      setMode('speech');
    } catch (error) {
      console.error("Speech challenge error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitSpeech = async (transcript: string) => {
    if (!activeSpeechChallenge) return;
    setIsLoading(true);
    try {
      const langName = LANGUAGES.find(l => l.code === targetLang)?.name || 'Spanish';
      const evaluation = await evaluateSpeechInput(activeSpeechChallenge.phraseToSpeak, transcript, langName);
      setSpeechEvaluation(evaluation);
    } catch (error) {
      console.error("Speech evaluation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayChallengePhrase = async () => {
    if (!activeSpeechChallenge || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const voiceMap: Record<string, string> = {
        'es': 'Puck', 'fr': 'Charon', 'de': 'Fenrir', 'it': 'Zephyr', 'pt': 'Zephyr',
        'hi': 'Kore', 'te': 'Puck', 'ta': 'Charon', 'ar': 'Fenrir', 'ja': 'Kore',
        'ko': 'Puck', 'zh': 'Zephyr'
      };
      const voice = voiceMap[targetLang] || 'Kore';
      const audioBase64 = await generateSpeech(activeSpeechChallenge.phraseToSpeak, voice);
      await playPCM(audioBase64);
    } catch (error) {
      console.error("Speech error:", error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const toggleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support speech recognition.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = sourceLang === 'en' ? 'en-US' : sourceLang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSourceText(transcript);
    };

    recognition.start();
  };

  const handleSpeak = async () => {
    if (!result?.translatedText || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const voiceMap: Record<string, string> = {
        'es': 'Puck', 'fr': 'Charon', 'de': 'Fenrir', 'it': 'Zephyr', 'pt': 'Zephyr',
        'hi': 'Kore', 'te': 'Puck', 'ta': 'Charon', 'ar': 'Fenrir', 'ja': 'Kore',
        'ko': 'Puck', 'zh': 'Zephyr'
      };
      const voice = voiceMap[targetLang] || 'Kore';
      const audioBase64 = await generateSpeech(result.translatedText, voice);
      await playPCM(audioBase64);
    } catch (error) {
      console.error("Speech error:", error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('linguist_history');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{APP_NAME}</h1>
            <p className="text-slate-500 font-medium">Linguistic mastery through AI</p>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto shadow-inner">
          <button 
            onClick={() => setMode('translate')}
            className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${mode === 'translate' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Translate
          </button>
          <button 
            onClick={() => setMode('quiz')}
            className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${mode === 'quiz' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            MCQ Quiz
          </button>
          <button 
            onClick={() => { if(!activeSpeechChallenge) handleStartSpeechQuiz(); else setMode('speech'); }}
            className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${mode === 'speech' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Speech Quiz
          </button>
        </div>
      </header>

      {mode === 'translate' ? (
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="glass rounded-3xl p-6 shadow-xl shadow-slate-200/50">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <LanguageSelector label="From" value={sourceLang} onChange={setSourceLang} />
                <div className="hidden sm:flex items-center justify-center pt-6 opacity-30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
                <LanguageSelector label="To" value={targetLang} onChange={setTargetLang} />
              </div>
              <div className="relative">
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Type or speak to translate..."
                  className="w-full h-48 bg-white border-2 border-slate-100 rounded-2xl p-5 text-lg font-medium text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none pr-16"
                />
                <button 
                  onClick={toggleListen}
                  className={`absolute bottom-6 right-6 p-4 rounded-2xl transition-all shadow-lg ${isListening ? 'bg-rose-500 text-white animate-pulse scale-110' : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>
              </div>
              <Button onClick={handleTranslate} isLoading={isLoading} disabled={!sourceText.trim()} className="w-full mt-6 py-4 text-lg rounded-2xl">
                Translate & Analyze
              </Button>
            </div>
            {history.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between px-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">History</h3>
                  <button onClick={clearHistory} className="text-xs font-bold text-indigo-500 hover:underline">Clear</button>
                </div>
                <div className="flex flex-col gap-3">
                  {history.map((item) => (
                    <button key={item.id} onClick={() => { setSourceText(item.sourceText); setResult(item.result); setSourceLang(item.sourceLang); setTargetLang(item.targetLang); }} className="p-4 bg-white border border-slate-100 rounded-2xl text-left hover:border-indigo-200 hover:shadow-md transition-all">
                      <p className="text-sm font-semibold text-slate-700">{item.sourceText}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-7">
            {isLoading ? (
               <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl p-12 shadow-sm">
                 <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                 <h3 className="text-lg font-bold text-slate-800">Gemini is thinking...</h3>
               </div>
            ) : result ? (
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 animate-slide">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-500">Translation</span>
                    <h2 className="text-3xl font-bold text-slate-900 mt-1">{result.translatedText}</h2>
                    {result.transliteration && <p className="text-lg text-slate-400 font-medium">/ {result.transliteration} /</p>}
                  </div>
                  <button onClick={handleSpeak} disabled={isSpeaking} className={`p-4 rounded-2xl transition-all ${isSpeaking ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-indigo-50'}`}>
                    <svg className={`w-6 h-6 ${isSpeaking ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  </button>
                </div>
                <LinguisticInsight result={result} />
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
                <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <p>Start by typing something in the left panel</p>
              </div>
            )}
          </div>
        </main>
      ) : mode === 'quiz' ? (
        <main className="max-w-4xl mx-auto py-8">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20">
               <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
               <h3 className="text-xl font-bold text-slate-800">Generating your unique quiz...</h3>
             </div>
          ) : activeQuiz ? (
            <QuizComponent 
              quiz={activeQuiz} 
              onComplete={(score) => { setQuizScore(score); setActiveQuiz(null); }} 
              onRestart={() => setActiveQuiz(null)}
            />
          ) : quizScore !== null ? (
            <div className="bg-white rounded-3xl p-12 shadow-xl border border-slate-100 text-center animate-slide">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Quiz Complete!</h2>
              <p className="text-slate-500 text-lg mb-8">You scored <span className="text-indigo-600 font-bold">{quizScore} / 5</span></p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleStartQuiz} className="px-8 py-3">Try Again (New Questions)</Button>
                <Button variant="secondary" onClick={() => { setQuizScore(null); setMode('translate'); }} className="px-8 py-3">Back to Translator</Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Multiple Choice Quiz</h2>
              <p className="text-slate-500 mb-8">Test your comprehension with dynamic challenges.</p>
              
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row gap-4">
                   <LanguageSelector label="Language" value={targetLang} onChange={setTargetLang} />
                   <div className="flex flex-col gap-2 w-full">
                     <label className="text-xs font-semibold text-slate-500 uppercase">Difficulty</label>
                     <div className="flex gap-2">
                       {DIFF_LEVELS.map(lv => (
                         <button 
                          key={lv} 
                          onClick={() => setDifficulty(lv)}
                          className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${difficulty === lv ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                         >
                           {lv}
                         </button>
                       ))}
                     </div>
                   </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Select Topic</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {QUIZ_TOPICS.map(topic => (
                      <button 
                        key={topic}
                        onClick={() => setSelectedTopic(topic)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all text-sm font-bold ${selectedTopic === topic ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-600 hover:border-slate-200'}`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleStartQuiz} className="w-full py-4 text-lg">Generate Quiz</Button>
              </div>
            </div>
          )}
        </main>
      ) : (
        /* SPEECH QUIZ MODE */
        <main className="py-8">
          {isLoading && !activeSpeechChallenge ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <h3 className="text-xl font-bold text-slate-800">Generating a speech challenge...</h3>
            </div>
          ) : activeSpeechChallenge ? (
            <SpeechQuiz 
              challenge={activeSpeechChallenge}
              onEvaluate={handleSubmitSpeech}
              onPlayNative={handlePlayChallengePhrase}
              evaluation={speechEvaluation}
              isLoading={isLoading}
              onNewChallenge={handleStartSpeechQuiz}
              isSpeaking={isSpeaking}
            />
          ) : (
            <div className="max-w-2xl mx-auto bg-white rounded-3xl p-10 shadow-xl border border-slate-100 text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Speak Like a Native</h2>
              <p className="text-slate-500 mb-8">Practice your pronunciation with AI feedback. We'll give you a phrase, and you speak it back to us.</p>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 text-left">
                  <LanguageSelector label="Practice Language" value={targetLang} onChange={setTargetLang} />
                   <div className="flex flex-col gap-2 w-full">
                     <label className="text-xs font-semibold text-slate-500 uppercase">Level</label>
                     <div className="flex gap-2">
                       {DIFF_LEVELS.map(lv => (
                         <button 
                          key={lv} 
                          onClick={() => setDifficulty(lv)}
                          className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${difficulty === lv ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                         >
                           {lv}
                         </button>
                       ))}
                     </div>
                   </div>
                </div>
                <Button onClick={handleStartSpeechQuiz} className="w-full py-4 text-lg">Start Speech Quiz</Button>
              </div>
            </div>
          )}
        </main>
      )}

      <footer className="mt-20 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm font-medium">
        LinguistAI • Multimodal Language Learning System
      </footer>
    </div>
  );
}
