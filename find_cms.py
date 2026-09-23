import json
import re

with open('server/data/leaders_cache.json', 'r', encoding='utf-8') as f:
    leaders = json.load(f)

# Collect all people currently marked as Chief Minister
current_cms = []

for l in leaders:
    is_cm = False
    details = []
    
    p = str(l.get('portfolio', '')).lower() + str(l.get('portfolios', [])).lower() + str(l.get('currentDesignation', '')).lower()
    if 'chief minister' in p or ' cm' in p or 'cm ' in p:
        is_cm = True
        details.append(f"Portfolios: {l.get('portfolio', '')} / {l.get('currentDesignation', '')}")
        
    for t in l.get('careerTimeline', []):
        if 'present' in str(t.get('year', '')).lower():
            if 'chief minister' in str(t.get('title', '')).lower():
                is_cm = True
                details.append(f"Timeline: {t.get('title', '')} ({t.get('year', '')})")
    
    if is_cm:
        current_cms.append({
            'name': l.get('name'),
            'state': l.get('state'),
            'party': l.get('party'),
            'details': " | ".join(details)
        })

print(f"Found {len(current_cms)} people listed as Chief Minister in the DB:")
for c in current_cms:
    print(f"{c['name']} ({c['state']}) - {c['party']}")
    print(f"   -> {c['details']}")
