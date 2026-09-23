import json
with open('server/data/leaders_cache.json', 'r', encoding='utf-8') as f:
    leaders = json.load(f)

cms = []
for l in leaders:
    p = str(l.get('portfolio', '')).lower() + str(l.get('currentDesignation', '')).lower()
    if 'chief minister' in p and 'deputy' not in p and 'former' not in p:
        cms.append(f"{l.get('state')}: {l.get('name')} ({l.get('party')})")

print(f"Total States with CM listed: {len(cms)}")
for cm in sorted(cms):
    print(cm)
