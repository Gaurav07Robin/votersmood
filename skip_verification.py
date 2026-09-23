import sys
import re

with open('client/src/components/OfficialElectionPoll.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add isSurvey flag and initial state
text = text.replace(
    "const [step, setStep] = useState(1);",
    "const isSurvey = election?.candidates?.[0]?.party === 'Survey Option';\n  const [step, setStep] = useState(isSurvey ? 4 : 1);"
)

# Modify handleStep4Candidate
old_step4 = """  const handleStep4Candidate = (candidateId) => {
    setSelectedCandidateId(candidateId);
    setStep(5);
  };"""

new_step4 = """  const handleStep4Candidate = (candidateId) => {
    setSelectedCandidateId(candidateId);
    if (isSurvey) {
      handleConfirmVoteSubmit(candidateId);
    } else {
      setStep(5);
    }
  };"""
text = text.replace(old_step4, new_step4)

# Modify handleConfirmVoteSubmit
old_submit = """  const handleConfirmVoteSubmit = async () => {
    if (!user || !selectedCandidateId || isSubmitting) return;"""

new_submit = """  const handleConfirmVoteSubmit = async (overrideCandId = null) => {
    const finalCandId = overrideCandId && typeof overrideCandId === 'string' ? overrideCandId : selectedCandidateId;
    if (!user || !finalCandId || isSubmitting) return;"""

text = text.replace(old_submit, new_submit)

# Fix the payload in handleConfirmVoteSubmit
text = text.replace("candidateId: selectedCandidateId,", "candidateId: finalCandId,")
text = text.replace("const voteRecord = { candidateId: selectedCandidateId,", "const voteRecord = { candidateId: finalCandId,")

# Change step 4 title if isSurvey
old_step4_ui = """            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              STEP 4 OF 5: SELECT YOUR PREFERRED CANDIDATE / PARTY
            </div>"""

new_step4_ui = """            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isSurvey ? 'SELECT YOUR PREFERRED SURVEY OPTION' : 'STEP 4 OF 5: SELECT YOUR PREFERRED CANDIDATE / PARTY'}
            </div>"""

text = text.replace(old_step4_ui, new_step4_ui)

# Change badge if isSurvey
old_badge = """            <span className="badge badge-featured" style={{ fontSize: '11px', padding: '4px 8px' }}>
              🗳️ OFFICIAL ELECTION POLL (ADMIN CONTROLLED)
            </span>"""
new_badge = """            <span className="badge badge-featured" style={{ fontSize: '11px', padding: '4px 8px' }}>
              {isSurvey ? '📋 OFFICIAL ADMIN SURVEY' : '🗳️ OFFICIAL ELECTION POLL (ADMIN CONTROLLED)'}
            </span>"""
text = text.replace(old_badge, new_badge)

# Update Vote Again button behavior
old_vote_again = """<button onClick={() => { setStep(1); setVoteErrorMsg(''); setJustVoted(false); }} className="btn-ghost" style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                    Vote Again / Change Mode
                  </button>"""
new_vote_again = """<button onClick={() => { setStep(isSurvey ? 4 : 1); setVoteErrorMsg(''); setJustVoted(false); }} className="btn-ghost" style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                    Vote Again
                  </button>"""
text = text.replace(old_vote_again, new_vote_again)

with open('client/src/components/OfficialElectionPoll.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated successfully")
