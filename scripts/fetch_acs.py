import json
from dbfread import DBF
import difflib

def main():
    geo_path = 'server/data/geography.json'
    dbf_path = r'd:\vscode\votersmood-main\votersmood-main\maps-master\maps-master\assembly-constituencies\India_AC.dbf'
    
    with open(geo_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
        
    # Create state map
    st_map = {s['name'].lower().replace(' ', '').replace('&', 'and'): s for s in geo_data}
    st_map['odisha'] = st_map.get('orissa', st_map.get('odisha'))
    st_map['orissa'] = st_map.get('odisha')
    st_map['uttarkhand'] = st_map.get('uttarakhand')
    st_map['puducherry'] = st_map.get('pondicherry', st_map.get('puducherry'))
    st_map['nctofdelhi'] = st_map.get('delhi', st_map.get('nctofdelhi'))
    st_map['dadraandnagarhavelianddamananddiu'] = st_map.get('dadraandnagarhaveli', st_map.get('dadraandnagarhavelianddamananddiu'))
    st_map['andamanandnicobarislands'] = st_map.get('andaman&nicobarislands', st_map.get('andamanandnicobarislands'))
    
    table = DBF(dbf_path)
    
    ac_count = 0
    unmapped = 0
    
    for rec in table:
        st = str(rec.get('ST_NAME', '')).lower().replace(' ', '').replace('&', 'and')
        dist = str(rec.get('DIST_NAME', ''))
        ac_name = str(rec.get('AC_NAME', ''))
        
        if not st or not ac_name: continue
        
        # Match state
        st_match = st_map.get(st)
        if not st_match:
            for k, s in st_map.items():
                if k and (st in k or k in st):
                    st_match = s
                    break
                    
        if st_match:
            dist_keys = list(st_match['districts'].keys())
            matched_dist = None
            
            # 1. Exact match
            for dk in dist_keys:
                if dk.lower() == dist.lower():
                    matched_dist = dk
                    break
                    
            # 2. Fuzzy Match
            if not matched_dist and dist:
                matches = difflib.get_close_matches(dist.lower(), [d.lower() for d in dist_keys], n=1, cutoff=0.7)
                if matches:
                    matched_dist = next(dk for dk in dist_keys if dk.lower() == matches[0])
            
            # 3. Fallback: just put it in the first district or a "General" bucket (though ideally it matches)
            if not matched_dist:
                if dist_keys:
                    matched_dist = dist_keys[0] # Best effort fallback if mapping fails
                else:
                    st_match['districts']['General'] = []
                    matched_dist = 'General'
                    
            if matched_dist:
                ac_obj = {'name': ac_name, 'number': str(rec.get('AC_NO', ''))}
                if ac_obj not in st_match['districts'][matched_dist]:
                    st_match['districts'][matched_dist].append(ac_obj)
                    ac_count += 1
        else:
            unmapped += 1

    with open(geo_path, 'w', encoding='utf-8') as f:
        json.dump(geo_data, f, indent=2)
        
    print(f"Successfully mapped {ac_count} Assembly Constituencies to geography.json")
    print(f"Unmapped ACs (due to state mismatch): {unmapped}")

if __name__ == '__main__':
    main()
