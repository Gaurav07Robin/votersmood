import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';


const QUESTION_CATEGORIES = [
  'Education',
  'Healthcare',
  'Employment',
  'Roads',
  'Infrastructure',
  'Electricity',
  'Water Supply',
  'Law & Order',
  'Corruption',
  'Agriculture',
  'Economy',
  'Environment',
  'Public Transport',
  'Women Safety',
  'Other'
];

const TARGET_SCOPES = [
  { value: 'mh2024', label: 'Maharashtra 2024 Assembly Elections', rawName: 'MH 2024 Election' },
  { value: 'delhi2025', label: 'Delhi 2025 Assembly Elections', rawName: 'Delhi 2025 Election' },
  { value: 'bihar2025', label: 'Bihar 2025 Assembly Elections', rawName: 'Bihar 2025 Election' },
  { value: 'wb2026', label: 'West Bengal 2026 Assembly Elections', rawName: 'WB 2026 Election' },
  { value: 'up2027', label: 'Uttar Pradesh 2027 Assembly Elections', rawName: 'UP 2027 Election' },
  { value: 'central', label: 'Central Government Administration', rawName: 'Central Govt' }
];

export default function PostComposer({ onPostCreated, openRegisterModal }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Open Question state
  const [isOpenQuestion, setIsOpenQuestion] = useState(false);
  const [targetScopeId, setTargetScopeId] = useState(TARGET_SCOPES[0].value);
  const [targetScopeName, setTargetScopeName] = useState(TARGET_SCOPES[0].rawName);
  const [questionCategory, setQuestionCategory] = useState('Water Supply');

  const handleTextareaInput = (e) => {
    setContent(e.target.value.slice(0, 500));
    e.target.style.height = 'auto';
    e.target.style.height = Math.max(48, e.target.scrollHeight) + 'px';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      if (openRegisterModal) openRegisterModal();
      return;
    }

    if (!content.trim() || content.length > 500) return;

    setIsSubmitting(true);
    try {
      // Dynamically extract the first hashtag from the content to use as the topic tag
      const hashtagsMatch = content.trim().match(/#[\w]+/g);
      const extractedTag = hashtagsMatch ? hashtagsMatch[0].replace('#', '').toUpperCase() : 'GENERAL';

      const created = await api.createPost({
        content: content.trim(),
        isOpenQuestion,
        targetLeaderId: isOpenQuestion ? targetScopeId : null,
        targetLeaderName: isOpenQuestion ? targetScopeName : null,
        questionCategory: isOpenQuestion ? questionCategory : null,
        leaderTag: isOpenQuestion ? targetScopeName.toUpperCase() : 'GENERAL FEEDBACK',
        topicTag: extractedTag,
      });

      setContent('');
      setIsOpenQuestion(false);
      if (onPostCreated) onPostCreated(created);
    } catch (error) {
      console.error('Post creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      style={{ 
        backgroundColor: '#FFFFFF', 
        border: '1px solid var(--border-default)', 
        borderRadius: '12px', 
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '20px'
      }}
    >
      {/* Borderless 2-Row Minimum Auto-Expanding Textarea (Same as Comment Input) */}
      <textarea
        className="borderless-input"
        value={content}
        onChange={handleTextareaInput}
        onClick={() => { if (!user && openRegisterModal) openRegisterModal(); }}
        placeholder={user ? "Write your insight or raise a public issue (max 500 chars)..." : "Sign in to post an insight (max 500 chars)..."}
        disabled={isSubmitting}
        maxLength={500}
        rows={1}
        style={{ 
          width: '100%', 
          border: 'none !important', 
          outline: 'none !important', 
          boxShadow: 'none !important',
          background: 'transparent', 
          backgroundColor: 'transparent',
          fontSize: '14px', 
          lineHeight: 1.5,
          color: 'var(--text-primary)', 
          cursor: user ? 'text' : 'pointer',
          padding: '4px 0',
          minHeight: '32px',
          resize: 'none',
          overflow: 'hidden'
        }}
      />

      {/* Open Question Section Toggle */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
          <input
            type="checkbox"
            id="openQuestionCheck"
            checked={isOpenQuestion}
            onChange={(e) => setIsOpenQuestion(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
          <label htmlFor="openQuestionCheck" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--accent-copper-text)', cursor: 'pointer' }}>
            ❓ MARK THIS POST AS A PUBLIC ISSUE
          </label>
        </div>
      )}

      {/* Revealed Open Question Controls */}
      {isOpenQuestion && user && (
        <div style={{ backgroundColor: 'var(--accent-copper-bg)', border: '1px solid var(--accent-copper-border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                TARGET ELECTION
              </label>
              <select
                value={targetScopeId}
                onChange={(e) => {
                  setTargetScopeId(e.target.value);
                  const found = TARGET_SCOPES.find(s => s.value === e.target.value);
                  if (found) setTargetScopeName(found.rawName);
                }}
                style={{ fontSize: '13px', border: '1px solid var(--border-subtle)', padding: '6px', borderRadius: '4px' }}
              >
                {TARGET_SCOPES.map(scope => (
                  <option key={scope.value} value={scope.value}>{scope.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                QUESTION CATEGORY
              </label>
              <select
                value={questionCategory}
                onChange={(e) => setQuestionCategory(e.target.value)}
                style={{ fontSize: '13px', border: '1px solid var(--border-subtle)', padding: '6px', borderRadius: '4px' }}
              >
                {QUESTION_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar (Clean Borderless Layout matching comment input) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
          {content.length}/500 CHARS MAX
        </span>

        <button
          type="submit"
          disabled={isSubmitting || (user && !content.trim())}
          className="btn-primary"
          style={{ fontSize: '12px', height: '36px', padding: '0 18px', borderRadius: '18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span>✈️</span> {isSubmitting ? 'POSTING...' : isOpenQuestion ? 'POST PUBLIC ISSUE' : 'POST INSIGHT'}
        </button>
      </div>
    </form>
  );
}
