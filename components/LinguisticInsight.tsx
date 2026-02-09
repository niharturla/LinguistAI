
import React from 'react';
import { TranslationResult } from '../types';

interface LinguisticInsightProps {
  result: TranslationResult;
}

export const LinguisticInsight: React.FC<LinguisticInsightProps> = ({ result }) => {
  return (
    <div className="flex flex-col gap-6 animate-slide">
      {/* Grammar Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <h3 className="font-bold text-slate-800">Grammar Focus</h3>
        </div>
        <div className="space-y-4">
          {result.grammarPoints.map((point, idx) => (
            <div key={idx} className="bg-slate-100/50 p-4 rounded-xl border border-slate-200/50">
              <h4 className="font-semibold text-indigo-700 text-sm mb-1">{point.rule}</h4>
              <p className="text-sm text-slate-600 mb-2">{point.explanation}</p>
              <div className="bg-white/50 px-3 py-1.5 rounded-lg border border-slate-200/50 text-xs italic text-slate-500">
                Example: {point.example}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Native Phrasing Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h3 className="font-bold text-slate-800">Native Phrasing</h3>
        </div>
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-sm text-amber-900 leading-relaxed">
          {result.nativeTips}
        </div>
      </section>

      {/* Vocabulary Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
          </div>
          <h3 className="font-bold text-slate-800">Key Vocabulary</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.vocabulary.map((vocab, idx) => (
            <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="font-bold text-slate-900 text-sm">{vocab.word}</div>
              <div className="text-xs text-indigo-600 font-medium mb-1">{vocab.meaning}</div>
              <div className="text-[11px] text-slate-500 leading-tight">{vocab.usage}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cultural Note */}
      {result.culturalNote && (
        <section className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          </div>
          <h4 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Cultural Insight</h4>
          <p className="text-sm leading-relaxed">{result.culturalNote}</p>
        </section>
      )}
    </div>
  );
};
