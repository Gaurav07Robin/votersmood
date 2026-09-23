import sys

with open('client/src/components/OfficialElectionPoll.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to find the `return (` block and insert our conditional rendering for isSurvey.
# We also need to remove my previous messy hacks that tried to style `isSurvey` in the main block.
# Actually, I can just replace the entire return block, but it's large.
# Let's insert the `if (isSurvey)` check at the top of the component logic.

survey_render = """  if (isSurvey) {
    const totalVotes = activePoll?.totalVotes || (residentTotal + observerTotal) || 0;
    
    return (
      <div 
        id={`poll-${activePoll.id}`}
        ref={cardRef}
        className={`gazette-card ${justVoted ? 'animate-vote-success' : ''}`}
        style={{ 
          backgroundColor: '#FFFFFF', 
          border: '1px solid var(--border-main)', 
          borderRadius: '8px', 
          padding: '18px',
          marginBottom: '32px',
          maxWidth: '420px',
          transition: 'all 200ms ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
            OFFICIAL GAZETTE (ADMIN)
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {hasVotedBefore && (
              <span className="badge badge-published animate-bounce-in" style={{ fontSize: '9px' }}>
                ✓ VOTE CONFIRMED
              </span>
            )}
            <span className="badge badge-featured" style={{ fontSize: '9px' }}>★ FEATURED SURVEY</span>
          </div>
        </div>

        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 700, margin: '0 0 20px 0', color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {activePoll?.title}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {activePoll?.candidates?.map(cand => {
            const votes = (activePoll?.residentVotes?.[cand.id] || 0) + (activePoll?.observerVotes?.[cand.id] || 0);
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isSelected = selectedCandidateId === cand.id || hasVotedBefore; // Simplified for now, just checking if voted

            // Check if THIS is the candidate the user voted for
            const isYourCandidate = selectedCandidateId === cand.id;

            return (
              <div 
                key={cand.id}
                onClick={() => !hasVotedBefore && handleStep4Candidate(cand.id)}
                style={{
                  backgroundColor: isYourCandidate ? '#ECFDF5' : 'var(--bg-secondary)',
                  border: isYourCandidate ? '2px solid #059669' : '1px solid var(--border-divider)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: hasVotedBefore ? 'default' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 150ms ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-primary)', fontWeight: isYourCandidate ? 700 : 500 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isYourCandidate && <span style={{ color: '#059669', fontWeight: 800 }}>✓</span>}
                    {cand.name}
                    {isYourCandidate && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#059669', fontWeight: 700 }}>(YOUR CHOICE)</span>}
                  </span>
                  {(hasVotedBefore || step === 6) && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>{pct}%</span>
                  )}
                </div>
                {(hasVotedBefore || step === 6) && (
                  <div style={{ height: '5px', backgroundColor: '#E5E2DC', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: isYourCandidate ? '#059669' : 'var(--accent-primary)', transition: 'width 300ms ease' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-divider)', paddingTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            🗳️ {totalVotes} CITIZEN VOTES
          </span>
          <button onClick={refreshLiveResults} className="btn-ghost" style={{ fontSize: '10px', color: 'var(--accent-primary)' }}>
            Refresh Live DB
          </button>
        </div>
      </div>
    );
  }

  return (
"""

text = text.replace("  return (\n    <>\n      <div \n        id={`poll-${activePoll.id}`}", survey_render + "    <>\n      <div \n        id={`poll-${activePoll.id}`}")

with open('client/src/components/OfficialElectionPoll.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Injected perfect survey render")
