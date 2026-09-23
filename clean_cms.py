import json

# The true list of Chief Ministers as of September 2026
true_cms = {
    'Andhra Pradesh': 'N. Chandrababu Naidu',
    'Arunachal Pradesh': 'Pema Khandu',
    'Assam': 'Himanta Biswa Sarma',
    'Bihar': 'Nitish Kumar',
    'Chhattisgarh': 'Vishnu Deo Sai',
    'Delhi': 'Arvind Kejriwal',
    'Goa': 'Pramod Sawant',
    'Gujarat': 'Bhupendrabhai Patel',
    'Haryana': 'Nayab Singh Saini',
    'Himachal Pradesh': 'Sukhvinder Singh Sukhu',
    'Jharkhand': 'Hemant Soren',
    'Karnataka': 'Siddaramaiah',
    'Kerala': 'V.D. Satheesan',
    'Madhya Pradesh': 'Mohan Yadav',
    'Maharashtra': 'Eknath Shinde',
    'Manipur': 'N. Biren Singh',
    'Meghalaya': 'Conrad Sangma',
    'Mizoram': 'Lalduhoma',
    'Nagaland': 'Neiphiu Rio',
    'Odisha': 'Mohan Charan Majhi',
    'Puducherry': 'N. Rangaswamy',
    'Punjab': 'Bhagwant Singh Mann',
    'Rajasthan': 'Bhajan Lal Sharma',
    'Sikkim': 'Prem Singh Tamang',
    'Tamil Nadu': 'C. Joseph Vijay',
    'Telangana': 'Anumula Revanth Reddy',
    'Tripura': 'Manik Saha',
    'Uttar Pradesh': 'Yogi Adityanath',
    'Uttarakhand': 'Pushkar Singh Dhami',
    'West Bengal': 'Suvendu Adhikari'
}

with open('server/data/leaders_cache.json', 'r', encoding='utf-8') as f:
    leaders = json.load(f)

for l in leaders:
    state = l.get('state', '')
    name = l.get('name', '')
    
    # Check if this person is the TRUE CM of their state
    is_true_cm = False
    for st, cm_name in true_cms.items():
        if state == st or state == 'Delhi (NCT)':
            # Simple string matching, e.g. "C. Joseph Vijay" matches "Joseph Vijay"
            if cm_name.lower().split()[-1] in name.lower() and cm_name.lower().split()[0] in name.lower():
                is_true_cm = True
                break
        
        # Specific overrides
        if name == 'Suvendu Adhikari' and state == 'West Bengal': is_true_cm = True
        if name == 'Eknath Shinde' and state == 'Maharashtra': is_true_cm = True
        if name == 'Yogi Adityanath' and state == 'Uttar Pradesh': is_true_cm = True
        if name == 'Nayab Singh' and state == 'Haryana': is_true_cm = True
        if 'Bhupendrabhai' in name and state == 'Gujarat': is_true_cm = True
        if 'P S Tamang' in name and state == 'Sikkim': is_true_cm = True
        if 'Revanth Reddy' in name: is_true_cm = True

    # Check if they are falsely claiming to be CM
    if not is_true_cm:
        # Strip CM from portfolio
        if 'Chief Minister' in str(l.get('portfolio', '')):
            l['portfolio'] = str(l['portfolio']).replace('Chief Minister, ', '').replace('Chief Minister', 'Member of Legislative Assembly (MLA)')
        
        if 'currentDesignation' in l and 'Chief Minister' in str(l['currentDesignation']):
            l['currentDesignation'] = str(l['currentDesignation']).replace('Chief Minister, ', '').replace('Chief Minister', 'MLA')
            if l['currentDesignation'] == '': del l['currentDesignation']
        
        # Strip CM from career timeline
        for t in l.get('careerTimeline', []):
            if 'Present' in str(t.get('year', '')):
                if 'Chief Minister' in str(t.get('title', '')):
                    t['title'] = t['title'].replace('Chief Minister', 'Member of Legislative Assembly')
                if 'Chief Minister' in str(t.get('description', '')):
                    t['description'] = t['description'].replace('Chief Minister', 'Member of Legislative Assembly')
                    t['description'] = t['description'].replace('chief minister', 'MLA')

    else:
        # THEY ARE THE REAL CM! ENSURE THEY HAVE THE TITLE!
        l['portfolio'] = f"Chief Minister of {state}"
        l['currentDesignation'] = f"Chief Minister"
        
        has_present_cm = False
        for t in l.get('careerTimeline', []):
            if 'Present' in str(t.get('year', '')) and 'Chief Minister' in str(t.get('title', '')):
                has_present_cm = True
        
        if not has_present_cm:
            l.setdefault('careerTimeline', []).insert(0, {
                'year': '2026 - Present',
                'title': f'Chief Minister of {state}',
                'description': f'Serving as the Chief Minister of {state}.',
                'place': state
            })

with open('server/data/leaders_cache.json', 'w', encoding='utf-8') as f:
    json.dump(leaders, f, indent=2, ensure_ascii=False)

print("Cleaned up fake CMs and updated real CMs!")
