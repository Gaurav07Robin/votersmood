import json
with open('server/data/leaders_cache.json', 'r', encoding='utf-8') as f:
    leaders = json.load(f)
for l in leaders:
    p = str(l.get('portfolio', '')).lower() + str(l.get('portfolios', [])).lower()
    if 'chief minister' in p or ' cm' in p or 'cm ' in p:
        print(f"{l.get('name')} - {l.get('party')} - {l.get('state')} - {l.get('portfolio')}")
