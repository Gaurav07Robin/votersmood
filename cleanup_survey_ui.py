import sys
import re

with open('client/src/components/OfficialElectionPoll.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Fix the top badge
badge_regex = r'<span className="badge badge-featured"[^>]*>.*?<\/span>'
new_badge = """<span className="badge badge-featured" style={{ fontSize: '11px', padding: '4px 8px' }}>
              {isSurvey ? '📋 OFFICIAL ADMIN SURVEY' : '🗳️ OFFICIAL ELECTION POLL (ADMIN CONTROLLED)'}
            </span>"""
text = re.sub(badge_regex, new_badge, text, count=1, flags=re.DOTALL)

# 2. Fix the Category label (hide if survey)
cat_regex = r'<span style=\{\{\s*fontFamily: \'var\(--font-mono\)\',\s*fontSize: \'12px\',\s*color: \'var\(--text-muted\)\'\s*\}\}>\s*CATEGORY:.*?ELECTION\s*<\/span>'
new_cat = """{!isSurvey && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                CATEGORY: {activePoll?.category?.toUpperCase() || 'NATIONAL'} ELECTION
              </span>
            )}"""
text = re.sub(cat_regex, new_cat, text)

# 3. Fix the Description (hide if survey)
desc_regex = r'<p style=\{\{\s*fontFamily: \'var\(--font-sans\)\',\s*fontSize: \'16px\',\s*color: \'var\(--text-secondary\)\',\s*marginBottom: \'24px\'\s*\}\}>\s*\{activePoll\?\.description\}\s*<\/p>'
new_desc = """{!isSurvey && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {activePoll?.description}
          </p>
        )}"""
text = re.sub(desc_regex, new_desc, text)

# 4. Hide "(Survey Option)" string in success box
succ_regex = r'Your vote for <strong>\{selectedCandidateObj\?\.name \|\| \'Selected Candidate\'\} \(\{selectedCandidateObj\?\.party \|\| \'\'\}\)<\/strong> has been securely logged\.'
new_succ = "Your vote for <strong>{selectedCandidateObj?.name || 'Selected Candidate'} {!isSurvey && `(${selectedCandidateObj?.party || ''})`}</strong> has been securely logged."
text = re.sub(succ_regex, new_succ, text)

# 5. Hide (Party) in lists
cand1_regex = r'\{cand\.name\} \(\{cand\.party\}\)'
new_cand1 = "{cand.name} {!isSurvey && `(${cand.party})`}"
text = re.sub(cand1_regex, new_cand1, text)

# 6. Hide (Party) in step 5 confirm
step5_regex = r'\{selectedCandidateObj\?\.name\} \(\{selectedCandidateObj\?\.party\}\)'
new_step5 = "{selectedCandidateObj?.name} {!isSurvey && `(${selectedCandidateObj?.party})`}"
text = re.sub(step5_regex, new_step5, text)

# 7. Change Titles of Results
res_title = r'LOCAL RESIDENT VOTES \(\{residentTotal\}\)'
new_res_title = '{isSurvey ? `SURVEY RESULTS (${activePoll?.totalVotes || residentTotal + observerTotal})` : `LOCAL RESIDENT VOTES (${residentTotal})`}'
text = re.sub(res_title, new_res_title, text)

obs_title = r'OUTSIDE OBSERVER VOTES \(\{observerTotal\}\)'
new_obs_title = '{!isSurvey ? `OUTSIDE OBSERVER VOTES (${observerTotal})` : ""}'
text = re.sub(obs_title, new_obs_title, text)

# 8. Hide observer column completely if survey
observer_column_regex = r'(<div style=\{\{\s*backgroundColor: \'var\(--bg-secondary\)\',\s*borderRadius: \'var\(--radius-card\)\',\s*padding: \'20px\'\s*\}\}>\s*<div style=\{\{\s*fontFamily: \'var\(--font-mono\)\',\s*fontSize: \'12px\',\s*fontWeight: 700,\s*color: \'var\(--text-muted\)\',\s*marginBottom: \'16px\'\s*\}\}>\s*🌐 \{!isSurvey \? `OUTSIDE OBSERVER VOTES \(\$\{observerTotal\}\)` : ""\}\s*<\/div>.*?(?:<\/div>\s*<\/div>\s*<\/div>))'
# It's better to just render conditionally
# Let's wrap the second column
two_cols_regex = r'(<div style=\{\{\s*display: \'grid\',\s*gridTemplateColumns: \')1fr 1fr(\',\s*gap: \'24px\'\s*\}\}>)'
new_two_cols = r"\1{isSurvey ? '1fr' : '1fr 1fr'}\2"
text = re.sub(two_cols_regex, new_two_cols, text)

obs_col_wrap = r'(<div style=\{\{\s*backgroundColor: \'var\(--bg-secondary\)\',\s*borderRadius: \'var\(--radius-card\)\',\s*padding: \'20px\'\s*\}\}>\s*<div style=\{\{\s*fontFamily: \'var\(--font-mono\)\',\s*fontSize: \'12px\',\s*fontWeight: 700,\s*color: \'var\(--text-muted\)\',\s*marginBottom: \'16px\'\s*\}\}>\s*🌐)'
new_obs_col_wrap = r"{!isSurvey && \1"
text = re.sub(obs_col_wrap, new_obs_col_wrap, text)

end_obs_col = r'(<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/>\s*\);\s*\})'
# Finding the exact end of observer col is tricky, I will use string replace for this one specific line
text = text.replace(
    "                </div>\n              </div>\n            </div>\n\n          </div>",
    "                </div>\n              </div>\n            )}</div>\n\n          </div>"
)

with open('client/src/components/OfficialElectionPoll.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Cleaned up survey UI text")
