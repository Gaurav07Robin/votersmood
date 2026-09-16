import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const TARGET_SCOPES = [
  { value: 'mh2024', label: 'Maharashtra 2024 Assembly Elections' },
  { value: 'delhi2025', label: 'Delhi 2025 Assembly Elections' },
  { value: 'bihar2025', label: 'Bihar 2025 Assembly Elections' },
  { value: 'wb2026', label: 'West Bengal 2026 Assembly Elections' },
  { value: 'up2027', label: 'Uttar Pradesh 2027 Assembly Elections' },
  { value: 'central', label: 'Central Government Administration' }
];

export default function CreateCommunityPollModal({ isOpen, onClose, onCreated }) {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [targetScope, setTargetScope] = useState('mh2024');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const handleOptionChange = (idx, value) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) return;

    setIsSubmitting(true);
    try {
      const created = await api.createCommunityPoll({
        question: question.trim(),
        options: validOptions,
        targetElection: targetScope
      });
      onCreated(created);
      onClose();
    } catch (e) {
      console.warn('Create community poll error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 'var(--radius-modal)', width: '100%', maxWidth: '500px', padding: '24px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '4px' }}>
          📊 CITIZEN ISSUE SURVEY CREATOR
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, margin: '0 0 16px 0' }}>
          Create Issue-Based Mini Poll
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>TARGET ELECTION</label>
            <select 
              value={targetScope} 
              onChange={(e) => setTargetScope(e.target.value)} 
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}
            >
              {TARGET_SCOPES.map(scope => (
                <option key={scope.value} value={scope.value}>{scope.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>SURVEY QUESTION / ISSUE</label>
            <input 
              type="text" 
              placeholder="e.g. What issue matters most in this election?" 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)} 
              required 
            />
          </div>

          {options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>OPTION {i + 1}</label>
              <input 
                type="text" 
                placeholder={`Option ${i + 1}`} 
                value={opt} 
                onChange={(e) => handleOptionChange(i, e.target.value)} 
                required={i < 2} 
              />
            </div>
          ))}

          {options.length < 6 && (
            <button type="button" onClick={handleAddOption} className="btn-ghost" style={{ fontSize: '11px', alignSelf: 'flex-start', color: 'var(--accent-primary)' }}>
              + Add Option
            </button>
          )}

          <button type="submit" disabled={isSubmitting || !question.trim()} className="btn-primary" style={{ padding: '10px', marginTop: '8px' }}>
            {isSubmitting ? 'CREATING...' : 'POST COMMUNITY ISSUE POLL'}
          </button>
        </form>
      </div>
    </div>
  );
}
