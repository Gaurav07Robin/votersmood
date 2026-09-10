import urllib.request
import json
import ssl
import os

def main():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    url = 'https://raw.githubusercontent.com/civictech-India/INDIA-GEO-JSON-Datasets/master/india_pc_2019.json'
    print(f"Downloading PC GeoJSON from {url}...")
    req = urllib.request.urlopen(url, context=ctx)
    data = json.loads(req.read())
    
    geo_path = 'server/data/geography.json'
    with open(geo_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
        
    st_map = {s['name'].lower().replace(' ', '').replace('&', 'and'): s for s in geo_data}
    st_map['orissa'] = st_map.get('odisha')
    st_map['puducherry'] = st_map.get('pondicherry', st_map.get('puducherry'))
    st_map['nctofdelhi'] = st_map.get('delhi', st_map.get('nctofdelhi'))
    st_map['dadraandnagarhavelianddamananddiu'] = st_map.get('dadraandnagarhaveli', st_map.get('dadraandnagarhavelianddamananddiu'))
    st_map['andamanandnicobarislands'] = st_map.get('andaman&nicobarislands', st_map.get('andamanandnicobarislands'))
    
    pc_count = 0
    for f in data['features']:
        st = f['properties'].get('st_name', '')
        pc_name = f['properties'].get('pc_name', '')
        if not st or not pc_name: continue
        
        st_norm = st.lower().replace(' ', '').replace('&', 'and')
        
        st_match = st_map.get(st_norm)
        if not st_match:
            # Try fuzzy match
            for k, s in st_map.items():
                if k and (st_norm in k or k in st_norm):
                    st_match = s
                    break
                    
        if st_match:
            pc_obj = {'name': pc_name, 'number': str(f['properties'].get('pc_no', ''))}
            
            # Avoid duplicates
            if not any(existing.get('name') == pc_name for existing in st_match['parliamentary']):
                st_match['parliamentary'].append(pc_obj)
                pc_count += 1
        else:
            print(f"Could not map state: {st} for PC {pc_name}")
            
    with open(geo_path, 'w', encoding='utf-8') as f:
        json.dump(geo_data, f, indent=2)
        
    print(f"Successfully added {pc_count} Parliamentary Constituencies to geography.json")

if __name__ == '__main__':
    main()
