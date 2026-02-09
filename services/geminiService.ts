
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranslationResult, QuizSet, QuizDifficulty, SpeechChallenge, SpeechEvaluation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const translateAndExplain = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate this text from ${sourceLang} to ${targetLang} and provide a detailed linguistic explanation for a language learner: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translatedText: { type: Type.STRING },
          transliteration: { type: Type.STRING, description: "Phonetic pronunciation if the script is different" },
          grammarPoints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                rule: { type: Type.STRING },
                explanation: { type: Type.STRING },
                example: { type: Type.STRING }
              },
              required: ["rule", "explanation", "example"]
            }
          },
          nativeTips: { type: Type.STRING, description: "Nuance or phrasing tips to sound more natural" },
          vocabulary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                meaning: { type: Type.STRING },
                usage: { type: Type.STRING }
              }
            }
          },
          culturalNote: { type: Type.STRING }
        },
        required: ["translatedText", "grammarPoints", "nativeTips", "vocabulary"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as TranslationResult;
};

export const generateQuiz = async (language: string, topic: string, difficulty: QuizDifficulty): Promise<QuizSet> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a NEW and UNIQUE 5-question multiple choice quiz for a student learning ${language}. 
    Difficulty: ${difficulty}. Topic: ${topic}. 
    CRITICAL: The QUESTION itself must ALWAYS be in English.
    For every OPTION, provide BOTH the version in the native ${language} script AND its Romanized transliteration (using English letters/Latin script).
    The explanation must be in English.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          language: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: `The question in English` },
                questionTransliteration: { type: Type.STRING, description: "Redundant field, set same as English question" },
                options: { type: Type.ARRAY, items: { type: Type.STRING }, description: `Options in native ${language} script` },
                optionsTransliteration: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Options in English letters (Romanized)" },
                correctAnswerIndex: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "questionTransliteration", "options", "optionsTransliteration", "correctAnswerIndex", "explanation"]
            }
          }
        },
        required: ["topic", "language", "questions"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as QuizSet;
};

export const generateSpeechChallenge = async (language: string, difficulty: string): Promise<SpeechChallenge> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide a common and useful sentence in ${language} for a student at ${difficulty} level to practice speaking. Also provide the English translation.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          phraseToSpeak: { type: Type.STRING },
          translation: { type: Type.STRING },
          targetLanguage: { type: Type.STRING }
        },
        required: ["phraseToSpeak", "translation", "targetLanguage"]
      }
    }
  });
  return JSON.parse(response.text || '{}') as SpeechChallenge;
};

export const evaluateSpeechInput = async (expected: string, transcript: string, language: string): Promise<SpeechEvaluation> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `As a language coach, evaluate how well a student said a phrase.
    Expected phrase in ${language}: "${expected}"
    What the student actually said (transcribed): "${transcript}"
    Evaluate accuracy, pronunciation, and flow. Provide a score from 0-100.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          accuracyFeedback: { type: Type.STRING },
          pronunciationTips: { type: Type.STRING },
          naturalness: { type: Type.STRING }
        },
        required: ["score", "accuracyFeedback", "pronunciationTips", "naturalness"]
      }
    }
  });
  return JSON.parse(response.text || '{}') as SpeechEvaluation;
};

export const generateSpeech = async (text: string, voice: string = 'Kore'): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data received from TTS model");
  return base64Audio;
};
