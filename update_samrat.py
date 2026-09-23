import json

with open('server/data/leaders_cache.json', 'r', encoding='utf-8') as f:
    leaders = json.load(f)

for l in leaders:
    if l.get('name') == 'Samrat Choudhary':
        l['portfolio'] = 'Chief Minister of Bihar'
        l['currentDesignation'] = 'Chief Minister'
        l.setdefault('careerTimeline', []).insert(0, {
            'year': '2026 - Present',
            'title': 'Chief Minister of Bihar',
            'description': 'Serving as the Chief Minister of Bihar since April 2026.',
            'place': 'Bihar'
        })
        print("Updated Samrat Choudhary!")

with open('server/data/leaders_cache.json', 'w', encoding='utf-8') as f:
    json.dump(leaders, f, indent=2, ensure_ascii=False)
