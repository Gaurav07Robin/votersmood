import sys
import os
import re
import json

def parse_delimitation(file_path, output_path):
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        sys.exit(1)

    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Split by SCHEDULE
    schedules = re.split(r'SCHEDULE\s*-\s*[IVXLCDM]+\b', content, flags=re.IGNORECASE)
    
    states_data = []

    for sch in schedules:
        lines = sch.strip().split('\n')
        if len(lines) < 2:
            continue
            
        # Try to find State Name
        state_name = ""
        table_a_idx = -1
        table_b_idx = -1
        
        for idx, line in enumerate(lines):
            l_up = line.upper()
            if ("TABLE A" in l_up) or ("PART A" in l_up) or (("ASSEMBLY" in l_up) and ("CONSTITUENC" in l_up) and len(l_up) < 40):
                table_a_idx = idx
                # Look upwards up to 5 lines for a valid state name
                for k in range(1, 6):
                    if idx - k < 0: break
                    potential = lines[idx-k].strip()
                    potential_alpha = re.sub(r'[^A-Za-z ]', '', potential).strip().upper()
                    if potential_alpha and potential_alpha not in ["DELIMITATION", "SL NO", "NAME", "SL NO  NAME", "EXTENT OF ASSEMBLY CONSTITUENCIES"]:
                        state_name = potential_alpha.title()
                        break
            if ("TABLE B" in l_up) or ("PART B" in l_up) or (("PARLIAMENTARY" in l_up) and ("CONSTITUENC" in l_up) and len(l_up) < 40):
                table_b_idx = idx

        if table_a_idx == -1:
            continue
            
        # Clean state name
        state_name = re.sub(r'[^A-Za-z ]', '', state_name).strip().title()
        if not state_name: continue
        
        state_obj = {
            "name": state_name,
            "districts": {},
            "parliamentary": []
        }
        
        current_district = "Unknown District"
        
        if table_b_idx == -1:
            table_b_idx = len(lines)
            
        # Parse Districts and Assembly Constituencies
        for j in range(table_a_idx, table_b_idx):
            l = lines[j].strip()
            if not l: continue
            
            # Match district header e.g. 1 - DISTRICT : KACHCHH
            m_dist = re.match(r'^\d+\s*[-–]\s*DISTRICT[S]?\s*:\s*(.*)$', l, re.IGNORECASE)
            if m_dist:
                current_district = m_dist.group(1).strip().title()
                if current_district not in state_obj["districts"]:
                    state_obj["districts"][current_district] = []
                continue
                
            # Match AC e.g. 1 - Abdasa    1. Lakhpat Taluka...
            # or 123-Gohad (SC)
            m_ac = re.match(r'^(\d+)\s*[-–\.]\s*([A-Za-z\s\(\)]+)(?:\s+(.*))?$', l)
            if m_ac:
                ac_num = m_ac.group(1).strip()
                ac_name = m_ac.group(2).strip()
                # Clean up if any extra text got in name
                ac_name = re.split(r'\s{2,}', ac_name)[0]
                
                if current_district not in state_obj["districts"]:
                    state_obj["districts"][current_district] = []
                    
                state_obj["districts"][current_district].append({
                    "number": ac_num,
                    "name": ac_name.strip()
                })
        
        # Parse Parliamentary Constituencies
        for j in range(table_b_idx, len(lines)):
            l = lines[j].strip()
            if not l: continue
            
            # Match PC
            m_pc = re.match(r'^(\d+)\s*[-–\.]\s*([A-Za-z\s\(\)]+)(?:\s+(.*))?$', l)
            if m_pc:
                pc_num = m_pc.group(1).strip()
                pc_name = m_pc.group(2).strip()
                pc_name = re.split(r'\s{2,}', pc_name)[0]
                state_obj["parliamentary"].append({
                    "number": pc_num,
                    "name": pc_name.strip()
                })
                
        # Clean up empty districts
        if "Unknown District" in state_obj["districts"] and not state_obj["districts"]["Unknown District"]:
            del state_obj["districts"]["Unknown District"]
            
        states_data.append(state_obj)
        print(f"Parsed {state_name}: {len(state_obj['districts'])} districts, {sum(len(acs) for acs in state_obj['districts'].values())} ACs, {len(state_obj['parliamentary'])} PCs")

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(states_data, f, indent=2)
        
    print(f"\nSuccessfully wrote parsed data to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python parse_delimitation.py <path_to_pdf_text_file>")
        sys.exit(1)
        
    input_file = sys.argv[1]
    
    # Ensure data directory exists
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'server', 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    output_file = os.path.join(data_dir, 'geography.json')
    
    parse_delimitation(input_file, output_file)
