import sys
import re

with open('client/src/components/OfficialElectionPoll.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Make Title smaller for Survey
title_regex = r'<h1 style=\{\{ fontFamily: \'var\(--font-serif\)\', fontSize: \'30px\', fontWeight: 800, color: \'var\(--text-primary\)\', margin: \'0 0 8px 0\', lineHeight: 1\.25 \}\}>'
new_title = r'<h1 style={{ fontFamily: \'var(--font-serif)\', fontSize: isSurvey ? \'20px\' : \'30px\', fontWeight: 800, color: \'var(--text-primary)\', margin: \'0 0 8px 0\', lineHeight: 1.25 }}>'
text = re.sub(title_regex, new_title, text)

# Remove the "SURVEY RESULTS (X)" header box completely if survey
# The original code has:
# <div style={{ backgroundColor: '#F9F8F6', border: '1px solid var(--border-divider)', borderRadius: '8px', padding: '16px' }}>
# <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '12px', borderBottom: '1px solid var(--border-divider)', paddingBottom: '6px' }}>
#   📊 {isSurvey ? `SURVEY RESULTS (${activePoll?.totalVotes || residentTotal + observerTotal})` : `LOCAL RESIDENT VOTES (${residentTotal})`}
# </div>
# <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

wrapper_regex = r'<div style=\{\{ backgroundColor: \'#F9F8F6\', border: \'1px solid var\(--border-divider\)\', borderRadius: \'8px\', padding: \'16px\' \}\}>\s*<div style=\{\{ fontFamily: \'var\(--font-mono\)\', fontSize: \'12px\', fontWeight: 700, color: \'var\(--accent-primary\)\', marginBottom: \'12px\', borderBottom: \'1px solid var\(--border-divider\)\', paddingBottom: \'6px\' \}\}>\s*📊 \{isSurvey \? `SURVEY RESULTS \(\$\{activePoll\?\.totalVotes \|\| residentTotal \+ observerTotal\}\)` : `LOCAL RESIDENT VOTES \(\$\{residentTotal\}\)`\}\s*<\/div>\s*<div style=\{\{ display: \'flex\', flexDirection: \'column\', gap: \'10px\' \}\}>'

new_wrapper = """<div style={{ backgroundColor: isSurvey ? 'transparent' : '#F9F8F6', border: isSurvey ? 'none' : '1px solid var(--border-divider)', borderRadius: isSurvey ? '0' : '8px', padding: isSurvey ? '0' : '16px' }}>
                {!isSurvey && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '12px', borderBottom: '1px solid var(--border-divider)', paddingBottom: '6px' }}>
                    📊 LOCAL RESIDENT VOTES ({residentTotal})
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: isSurvey ? '8px' : '10px' }}>"""

text = re.sub(wrapper_regex, new_wrapper, text)

# Now fix the individual options layout if it's a survey.
# Original:
# <div key={cand.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
#   <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: isYourCandidate ? 700 : 600 }}>
#     <span style={{ color: isYourCandidate ? '#059669' : 'var(--text-primary)' }}>
#       {isYourCandidate && '✓ '}
#       {cand.name} {!isSurvey && `(${cand.party})`}
#       {isYourCandidate && ' (YOUR VOTE)'}
#     </span>
#     <span style={{ fontFamily: 'var(--font-mono)' }}>{pct}% ({votes})</span>
#   </div>
#   <div style={{ height: '8px', backgroundColor: '#E5E2DC', borderRadius: '4px', overflow: 'hidden' }}>
#     <div style={{ height: '100%', width: `${pct}%`, backgroundColor: isYourCandidate ? '#059669' : (cand.color || 'var(--accent-primary)'), transition: 'width 400ms ease' }} />
#   </div>
# </div>

option_regex = r'<div key=\{cand\.id\} style=\{\{ display: \'flex\', flexDirection: \'column\', gap: \'4px\' \}\}>\s*<div style=\{\{ display: \'flex\', justifyContent: \'space-between\', fontFamily: \'var\(--font-sans\)\', fontSize: \'13px\', fontWeight: isYourCandidate \? 700 : 600 \}\}>\s*<span style=\{\{ color: isYourCandidate \? \'#059669\' : \'var\(--text-primary\)\' \}\}>\s*\{isYourCandidate && \'✓ \'\}\s*\{cand\.name\} \{!isSurvey && `\(\$\{cand\.party\}\)`\}\s*\{isYourCandidate && \' \(YOUR VOTE\)\'\}\s*<\/span>\s*<span style=\{\{ fontFamily: \'var\(--font-mono\)\' \}\}>\{pct\}% \(\{votes\}\)<\/span>\s*<\/div>\s*<div style=\{\{ height: \'8px\', backgroundColor: \'#E5E2DC\', borderRadius: \'4px\', overflow: \'hidden\' \}\}>\s*<div style=\{\{ height: \'100%\', width: `\$\{pct\}%`, backgroundColor: isYourCandidate \? \'#059669\' : \(cand\.color \|\| \'var\(--accent-primary\)\'\), transition: \'width 400ms ease\' \}\} \/>\s*<\/div>\s*<\/div>'

new_option = """<div 
                      key={cand.id} 
                      style={isSurvey ? {
                        backgroundColor: isYourCandidate ? '#ECFDF5' : 'var(--bg-secondary)',
                        border: isYourCandidate ? '2px solid #059669' : '1px solid var(--border-divider)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      } : { display: 'flex', flexDirection: 'column', gap: '4px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: isYourCandidate ? 700 : (isSurvey ? 500 : 600) }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (isYourCandidate && !isSurvey) ? '#059669' : 'var(--text-primary)' }}>
                            {isYourCandidate && <span style={{ color: '#059669', fontWeight: 800 }}>✓</span>}
                            {cand.name} {!isSurvey && `(${cand.party})`}
                            {isYourCandidate && !isSurvey && ' (YOUR VOTE)'}
                            {isYourCandidate && isSurvey && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#059669', fontWeight: 700 }}>(YOUR CHOICE)</span>}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: isSurvey ? '11px' : '13px', fontWeight: isSurvey ? 700 : 400 }}>{pct}% {!isSurvey && `(${votes})`}</span>
                        </div>
                        <div style={{ height: isSurvey ? '5px' : '8px', backgroundColor: '#E5E2DC', borderRadius: isSurvey ? '3px' : '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: isYourCandidate ? '#059669' : (isSurvey ? 'var(--accent-primary)' : (cand.color || 'var(--accent-primary)')), transition: 'width 400ms ease' }} />
                        </div>
                      </div>"""

text = re.sub(option_regex, new_option, text)

# Lastly, if it's a survey, we should hide the "OFFICIAL ELECTION RESULTS (TOTAL VOTES: X)" big header, but we still need the total votes.
# Original: 
# <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
#   OFFICIAL ELECTION RESULTS (TOTAL VOTES: {activePoll?.totalVotes || residentTotal + observerTotal})
# </span>

header_regex = r'<span style=\{\{ fontFamily: \'var\(--font-mono\)\', fontSize: \'14px\', fontWeight: 700, color: \'var\(--text-primary\)\' \}\}>\s*OFFICIAL ELECTION RESULTS \(TOTAL VOTES: \{activePoll\?\.totalVotes \|\| residentTotal \+ observerTotal\}\)\s*<\/span>'
new_header = """<span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isSurvey ? `📊 SURVEY RESULTS (TOTAL VOTES: ${activePoll?.totalVotes || residentTotal + observerTotal})` : `OFFICIAL ELECTION RESULTS (TOTAL VOTES: ${activePoll?.totalVotes || residentTotal + observerTotal})`}
              </span>"""
text = re.sub(header_regex, new_header, text)

with open('client/src/components/OfficialElectionPoll.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated survey styling")
