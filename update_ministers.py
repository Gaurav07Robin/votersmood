import json

data = {
  "prime_minister": "Narendra Modi",
  "cabinet_ministers": [
    {"name": "Rajnath Singh", "portfolio": "Minister of Defence"},
    {"name": "Amit Shah", "portfolio": "Minister of Home Affairs; Minister of Cooperation"},
    {"name": "Nitin Jairam Gadkari", "portfolio": "Minister of Road Transport and Highways"},
    {"name": "Jagat Prakash Nadda", "portfolio": "Minister of Health and Family Welfare; Minister of Chemicals and Fertilizers"},
    {"name": "Shivraj Singh Chouhan", "portfolio": "Minister of Agriculture and Farmers Welfare; Minister of Rural Development"},
    {"name": "Nirmala Sitharaman", "portfolio": "Minister of Finance; Minister of Corporate Affairs"},
    {"name": "Subrahmanyam Jaishankar", "portfolio": "Minister of External Affairs"},
    {"name": "Manohar Lal Khattar", "portfolio": "Minister of Housing and Urban Affairs; Minister of Power"},
    {"name": "H. D. Kumaraswamy", "portfolio": "Minister of Heavy Industries; Minister of Steel"},
    {"name": "Piyush Goyal", "portfolio": "Minister of Commerce and Industry"},
    {"name": "Dharmendra Pradhan", "portfolio": "Minister of Education"},
    {"name": "Jitan Ram Manjhi", "portfolio": "Minister of Micro, Small and Medium Enterprises"},
    {"name": "Rajiv Ranjan Singh", "portfolio": "Minister of Panchayati Raj; Minister of Fisheries, Animal Husbandry and Dairying"},
    {"name": "Sarbananda Sonowal", "portfolio": "Minister of Ports, Shipping and Waterways"},
    {"name": "Virendra Kumar", "portfolio": "Minister of Social Justice and Empowerment"},
    {"name": "Kinjarapu Ram Mohan Naidu", "portfolio": "Minister of Civil Aviation"},
    {"name": "Pralhad Joshi", "portfolio": "Minister of Consumer Affairs, Food and Public Distribution; Minister of New and Renewable Energy"},
    {"name": "Jual Oram", "portfolio": "Minister of Tribal Affairs"},
    {"name": "Giriraj Singh", "portfolio": "Minister of Textiles"},
    {"name": "Ashwini Vaishnaw", "portfolio": "Minister of Railways; Minister of Information and Broadcasting; Minister of Electronics and Information Technology"},
    {"name": "Jyotiraditya M. Scindia", "portfolio": "Minister of Communications; Minister of Development of North Eastern Region"},
    {"name": "Bhupender Yadav", "portfolio": "Minister of Environment, Forest and Climate Change"},
    {"name": "Gajendra Singh Shekhawat", "portfolio": "Minister of Culture; Minister of Tourism"},
    {"name": "Annapurna Devi", "portfolio": "Minister of Women and Child Development"},
    {"name": "Kiren Rijiju", "portfolio": "Minister of Parliamentary Affairs; Minister of Minority Affairs"},
    {"name": "Hardeep Singh Puri", "portfolio": "Minister of Petroleum and Natural Gas"},
    {"name": "Mansukh Mandaviya", "portfolio": "Minister of Labour and Employment; Minister of Youth Affairs and Sports"},
    {"name": "G. Kishan Reddy", "portfolio": "Minister of Coal; Minister of Mines"},
    {"name": "Chirag Paswan", "portfolio": "Minister of Food Processing Industries"},
    {"name": "C. R. Paatil", "portfolio": "Minister of Jal Shakti"},
    {"name": "Rao Inderjit Singh", "portfolio": "Minister of State (Independent Charge) of Statistics and Programme Implementation; Planning; MoS Culture"},
    {"name": "Dr. Jitendra Singh", "portfolio": "Minister of State (Independent Charge) of Science and Technology; Earth Sciences; MoS PMO; Personnel, Public Grievances and Pensions; Atomic Energy; Space"},
    {"name": "Arjun Ram Meghwal", "portfolio": "Minister of State (Independent Charge) of Law and Justice; MoS Parliamentary Affairs"},
    {"name": "Prataprao Ganpatrao Jadhav", "portfolio": "Minister of State (Independent Charge) of Ayush; MoS Health and Family Welfare"},
    {"name": "Jayant Chaudhary", "portfolio": "Minister of State (Independent Charge) of Skill Development and Entrepreneurship; MoS Education"},
    {"name": "Jitin Prasada", "portfolio": "Minister of State in Commerce and Industry; Electronics and Information Technology"},
    {"name": "Shripad Yesso Naik", "portfolio": "Minister of State in Power; New and Renewable Energy"},
    {"name": "Pankaj Chaudhary", "portfolio": "Minister of State in Finance"},
    {"name": "Krishan Pal Gurjar", "portfolio": "Minister of State in Cooperation"},
    {"name": "Ramdas Athawale", "portfolio": "Minister of State in Social Justice and Empowerment"},
    {"name": "Ram Nath Thakur", "portfolio": "Minister of State in Agriculture and Farmers Welfare"},
    {"name": "Nityanand Rai", "portfolio": "Minister of State in Home Affairs"},
    {"name": "Anupriya Patel", "portfolio": "Minister of State in Health and Family Welfare; Chemicals and Fertilizers"},
    {"name": "V. Somanna", "portfolio": "Minister of State in Jal Shakti; Railways"},
    {"name": "Chandra Sekhar Pemmasani", "portfolio": "Minister of State in Rural Development; Communications"},
    {"name": "S. P. Singh Baghel", "portfolio": "Minister of State in Fisheries, Animal Husbandry and Dairying; Panchayati Raj"},
    {"name": "Shobha Karandlaje", "portfolio": "Minister of State in Micro, Small and Medium Enterprises; Labour and Employment"},
    {"name": "Kirti Vardhan Singh", "portfolio": "Minister of State in Environment, Forest and Climate Change; External Affairs"},
    {"name": "B. L. Verma", "portfolio": "Minister of State in Consumer Affairs, Food and Public Distribution; Social Justice and Empowerment"},
    {"name": "Shantanu Thakur", "portfolio": "Minister of State in Ports, Shipping and Waterways"},
    {"name": "Suresh Gopi", "portfolio": "Minister of State in Petroleum and Natural Gas; Tourism"},
    {"name": "L. Murugan", "portfolio": "Minister of State in Information and Broadcasting; Parliamentary Affairs"},
    {"name": "Ajay Tamta", "portfolio": "Minister of State in Road Transport and Highways"},
    {"name": "Bandi Sanjay Kumar", "portfolio": "Minister of State in Home Affairs"},
    {"name": "Kamlesh Paswan", "portfolio": "Minister of State in Rural Development"},
    {"name": "Bhagirath Choudhary", "portfolio": "Minister of State in Agriculture and Farmers Welfare"},
    {"name": "Satish Chandra Dubey", "portfolio": "Minister of State in Coal; Mines"},
    {"name": "Sanjay Seth", "portfolio": "Minister of State in Defence"},
    {"name": "Ravneet Singh Bittu", "portfolio": "Minister of State in Food Processing Industries; Railways"},
    {"name": "Durgadas Uikey", "portfolio": "Minister of State in Tribal Affairs"},
    {"name": "Savitri Thakur", "portfolio": "Minister of State in Women and Child Development"},
    {"name": "Sukanta Majumdar", "portfolio": "Minister of State in Education; Development of North Eastern Region"},
    {"name": "Harsh Malhotra", "portfolio": "Minister of State in Corporate Affairs; Road Transport and Highways"},
    {"name": "Nimuben Bambhaniya", "portfolio": "Minister of State in Consumer Affairs, Food and Public Distribution"},
    {"name": "Murlidhar Mohol", "portfolio": "Minister of State in Cooperation; Civil Aviation"},
    {"name": "George Kurian", "portfolio": "Minister of State in Minority Affairs; Fisheries, Animal Husbandry and Dairying"},
    {"name": "Pabitra Margherita", "portfolio": "Minister of State in External Affairs; Textiles"},
    {"name": "Tokhan Sahu", "portfolio": "Minister of State in Housing and Urban Affairs"},
    {"name": "Raj Bhushan Choudhary", "portfolio": "Minister of State in Jal Shakti"},
    {"name": "Bhupathi Raju Srinivasa Varma", "portfolio": "Minister of State in Heavy Industries; Steel"},
    {"name": "Raksha Khadse", "portfolio": "Minister of State in Youth Affairs and Sports"}
  ],
  "state_ministers": [
    {"name": "Pawan Kalyan", "state": "Andhra Pradesh", "portfolio": "Deputy Chief Minister; Panchayati Raj, Rural Development & Environment"},
    {"name": "Nara Lokesh", "state": "Andhra Pradesh", "portfolio": "Minister of Human Resource Development, IT, Electronics & Communication"},
    {"name": "Payyavula Keshav", "state": "Andhra Pradesh", "portfolio": "Minister of Finance & Planning"},
    {"name": "Vangalapudi Anitha", "state": "Andhra Pradesh", "portfolio": "Minister of Home Affairs & Disaster Management"},
    {"name": "Chowna Mein", "state": "Arunachal Pradesh", "portfolio": "Deputy Chief Minister; Finance, Planning & Power"},
    {"name": "Biyuram Wahge", "state": "Arunachal Pradesh", "portfolio": "Minister of Health & Family Welfare"},
    {"name": "Mama Natung", "state": "Arunachal Pradesh", "portfolio": "Minister of Home & Inter-State Border Affairs"},
    {"name": "Dasanglu Pul", "state": "Arunachal Pradesh", "portfolio": "Minister of Women & Child Development and Cultural Affairs"},
    {"name": "Ajanta Neog", "state": "Assam", "portfolio": "Minister of Finance and Women & Child Development"},
    {"name": "Atul Bora", "state": "Assam", "portfolio": "Minister of Agriculture, Horticulture & Animal Husbandry"},
    {"name": "Ranjit Kumar Dass", "state": "Assam", "portfolio": "Minister of Panchayat & Rural Development, Food & Civil Supplies"},
    {"name": "Keshab Mahanta", "state": "Assam", "portfolio": "Minister of Transport & Fisheries"},
    {"name": "Vijay Kumar Sinha", "state": "Bihar", "portfolio": "Deputy Chief Minister; Road Construction, Mines & Geology"},
    {"name": "Bijendra Prasad Yadav", "state": "Bihar", "portfolio": "Minister of Energy, Planning & Development"},
    {"name": "Vijay Kumar Choudhary", "state": "Bihar", "portfolio": "Minister of Water Resources & Parliamentary Affairs"},
    {"name": "Arun Sao", "state": "Chhattisgarh", "portfolio": "Deputy Chief Minister; Public Works & Public Health Engineering"},
    {"name": "Vijay Sharma", "state": "Chhattisgarh", "portfolio": "Deputy Chief Minister; Home, Jail & Rural Development"},
    {"name": "O. P. Choudhary", "state": "Chhattisgarh", "portfolio": "Minister of Finance, Commercial Tax & Housing"},
    {"name": "Ramvichar Netam", "state": "Chhattisgarh", "portfolio": "Minister of Agriculture & Tribal Development"},
    {"name": "Parvesh Verma", "state": "Delhi", "portfolio": "Minister of Public Works Department, Water & Irrigation"},
    {"name": "Ashish Sood", "state": "Delhi", "portfolio": "Minister of Home, Power, Urban Development & Education"},
    {"name": "Manjinder Singh Sirsa", "state": "Delhi", "portfolio": "Minister of Food & Supplies, Environment & Forest"},
    {"name": "Kapil Mishra", "state": "Delhi", "portfolio": "Minister of Law & Justice, Labour & Tourism"},
    {"name": "Vishwajit Rane", "state": "Goa", "portfolio": "Minister of Health, Town & Country Planning and Forest"},
    {"name": "Mauvin Godinho", "state": "Goa", "portfolio": "Minister of Transport, Industries & Panchayati Raj"},
    {"name": "Ravi Naik", "state": "Goa", "portfolio": "Minister of Agriculture"},
    {"name": "Subhash Shirodkar", "state": "Goa", "portfolio": "Minister of Water Resources & Co-operation"},
    {"name": "Kanubhai Desai", "state": "Gujarat", "portfolio": "Minister of Finance, Energy & Petrochemicals"},
    {"name": "Rushikesh Patel", "state": "Gujarat", "portfolio": "Minister of Health, Higher Education & Law"},
    {"name": "Raghavji Patel", "state": "Gujarat", "portfolio": "Minister of Agriculture & Animal Husbandry"},
    {"name": "Balvantsinh Rajput", "state": "Gujarat", "portfolio": "Minister of Industries, MSME & Labour"},
    {"name": "Anil Vij", "state": "Haryana", "portfolio": "Minister of Energy, Transport & Labour"},
    {"name": "Krishan Lal Panwar", "state": "Haryana", "portfolio": "Minister of Development & Panchayats, Mines & Geology"},
    {"name": "Rao Narbir Singh", "state": "Haryana", "portfolio": "Minister of Industries & Commerce, Environment & Forests"},
    {"name": "Vipul Goel", "state": "Haryana", "portfolio": "Minister of Revenue & Disaster Management, Urban Local Bodies"},
    {"name": "Mukesh Agnihotri", "state": "Himachal Pradesh", "portfolio": "Deputy Chief Minister; Jal Shakti & Transport"},
    {"name": "Vikramaditya Singh", "state": "Himachal Pradesh", "portfolio": "Minister of Public Works & Urban Development"},
    {"name": "Chander Kumar", "state": "Himachal Pradesh", "portfolio": "Minister of Agriculture & Animal Husbandry"},
    {"name": "Harshwardhan Chauhan", "state": "Himachal Pradesh", "portfolio": "Minister of Industries & Parliamentary Affairs"},
    {"name": "Surinder Kumar Choudhary", "state": "Jammu and Kashmir", "portfolio": "Deputy Chief Minister; Public Works, Industries & Commerce"},
    {"name": "Sakeena Masood", "state": "Jammu and Kashmir", "portfolio": "Minister of Health & Medical Education, School & Higher Education"},
    {"name": "Javed Ahmed Rana", "state": "Jammu and Kashmir", "portfolio": "Minister of Jal Shakti, Forest & Tribal Affairs"},
    {"name": "Javid Ahmad Dar", "state": "Jammu and Kashmir", "portfolio": "Minister of Agriculture Production, Rural Development & Panchayati Raj"},
    {"name": "Radha Krishna Kishore", "state": "Jharkhand", "portfolio": "Minister of Finance & Commercial Taxes"},
    {"name": "Irfan Ansari", "state": "Jharkhand", "portfolio": "Minister of Health & Family Welfare, Food & Public Distribution"},
    {"name": "Shilpi Neha Tirkey", "state": "Jharkhand", "portfolio": "Minister of Agriculture, Animal Husbandry & Cooperative"},
    {"name": "Deepika Pandey Singh", "state": "Jharkhand", "portfolio": "Minister of Rural Development & Panchayati Raj"},
    {"name": "D. K. Shivakumar", "state": "Karnataka", "portfolio": "Deputy Chief Minister; Major Irrigation & Bengaluru Development"},
    {"name": "G. Parameshwara", "state": "Karnataka", "portfolio": "Minister of Home Affairs"},
    {"name": "H. K. Patil", "state": "Karnataka", "portfolio": "Minister of Law, Parliamentary Affairs & Tourism"},
    {"name": "Priyank Kharge", "state": "Karnataka", "portfolio": "Minister of Rural Development & Panchayati Raj, IT & BT"},
    {"name": "K. N. Balagopal", "state": "Kerala", "portfolio": "Minister of Finance"},
    {"name": "P. Rajeeve", "state": "Kerala", "portfolio": "Minister of Industries & Law"},
    {"name": "K. Rajan", "state": "Kerala", "portfolio": "Minister of Revenue & Housing"},
    {"name": "Veena George", "state": "Kerala", "portfolio": "Minister of Health & Family Welfare, Women & Child Development"},
    {"name": "Jagdish Devda", "state": "Madhya Pradesh", "portfolio": "Deputy Chief Minister; Finance & Commercial Tax"},
    {"name": "Rajendra Shukla", "state": "Madhya Pradesh", "portfolio": "Deputy Chief Minister; Public Health & Medical Education"},
    {"name": "Kailash Vijayvargiya", "state": "Madhya Pradesh", "portfolio": "Minister of Urban Development, Housing & Parliamentary Affairs"},
    {"name": "Prahlad Singh Patel", "state": "Madhya Pradesh", "portfolio": "Minister of Panchayat & Rural Development"},
    {"name": "Sunetra Pawar", "state": "Maharashtra", "portfolio": "Deputy Chief Minister; State Excise, Sports & Youth Welfare"},
    {"name": "Chandrashekhar Bawankule", "state": "Maharashtra", "portfolio": "Minister of Revenue"},
    {"name": "Radhakrishna Vikhe-Patil", "state": "Maharashtra", "portfolio": "Minister of Water Resources"},
    {"name": "Th. Biswajit Singh", "state": "Manipur", "portfolio": "Minister of Forest, Environment & Agriculture"},
    {"name": "Y. Khemchand Singh", "state": "Manipur", "portfolio": "Minister of Municipal Administration, Rural Development & Panchayati Raj"},
    {"name": "Govindas Konthoujam", "state": "Manipur", "portfolio": "Minister of Public Works, Youth Affairs & Sports"},
    {"name": "Awangbow Newmai", "state": "Manipur", "portfolio": "Minister of Water Resources, Relief & Disaster Management"},
    {"name": "Prestone Tynsong", "state": "Meghalaya", "portfolio": "Deputy Chief Minister; Public Works Department & Parliamentary Affairs"},
    {"name": "Sniawbhalang Dhar", "state": "Meghalaya", "portfolio": "Deputy Chief Minister; Commerce, Industries & Transport"},
    {"name": "Ampareen Lyngdoh", "state": "Meghalaya", "portfolio": "Minister of Agriculture, Farmers' Welfare, Health & Family Welfare"},
    {"name": "Abu Taher Mondal", "state": "Meghalaya", "portfolio": "Minister of Power, Community & Rural Development, Taxation"},
    {"name": "K. Sapdanga", "state": "Mizoram", "portfolio": "Minister of Home, Information & Public Relations"},
    {"name": "Vanlalhlana", "state": "Mizoram", "portfolio": "Minister of Public Works & Transport"},
    {"name": "C. Lalsawivunga", "state": "Mizoram", "portfolio": "Minister of Local Administration, Art & Culture"},
    {"name": "Lalthansanga", "state": "Mizoram", "portfolio": "Minister of Environment, Forest & Climate Change"},
    {"name": "T. R. Zeliang", "state": "Nagaland", "portfolio": "Deputy Chief Minister; Planning & Transformation, National Highway"},
    {"name": "Yanthungo Patton", "state": "Nagaland", "portfolio": "Deputy Chief Minister; Home & Border Affairs"},
    {"name": "G. Kaito Aye", "state": "Nagaland", "portfolio": "Minister of Roads & Bridges"},
    {"name": "Jacob Zhimomi", "state": "Nagaland", "portfolio": "Minister of Public Health Engineering & Cooperation"},
    {"name": "Kanak Vardhan Singh Deo", "state": "Odisha", "portfolio": "Deputy Chief Minister; Agriculture & Energy"},
    {"name": "Pravati Parida", "state": "Odisha", "portfolio": "Deputy Chief Minister; Women & Child Development and Tourism"},
    {"name": "Suresh Pujari", "state": "Odisha", "portfolio": "Minister of Revenue & Disaster Management"},
    {"name": "Prithiviraj Harichandan", "state": "Odisha", "portfolio": "Minister of Law, Works & Excise"},
    {"name": "A. Namassivayam", "state": "Puducherry", "portfolio": "Home Minister; Electricity & Education"},
    {"name": "Malladi Krishna Rao", "state": "Puducherry", "portfolio": "Minister of Public Works, Tourism & Civil Aviation"},
    {"name": "P. Rajavelu", "state": "Puducherry", "portfolio": "Minister of Adi Dravidar Welfare, Art & Culture, IT"},
    {"name": "Harpal Singh Cheema", "state": "Punjab", "portfolio": "Minister of Finance, Planning & Excise"},
    {"name": "Aman Arora", "state": "Punjab", "portfolio": "Minister of Employment Generation, New & Renewable Energy"},
    {"name": "Harjot Singh Bains", "state": "Punjab", "portfolio": "Minister of School & Higher Education"},
    {"name": "Dr. Baljit Kaur", "state": "Punjab", "portfolio": "Minister of Social Justice, Women & Child Development"},
    {"name": "Diya Kumari", "state": "Rajasthan", "portfolio": "Deputy Chief Minister; Finance, Tourism & PWD"},
    {"name": "Prem Chand Bairwa", "state": "Rajasthan", "portfolio": "Deputy Chief Minister; Higher Education & Transport"},
    {"name": "Kirodi Lal Meena", "state": "Rajasthan", "portfolio": "Minister of Agriculture, Rural Development & Disaster Management"},
    {"name": "Gajendra Singh Khimsar", "state": "Rajasthan", "portfolio": "Minister of Medical & Health"},
    {"name": "Sonam Lama", "state": "Sikkim", "portfolio": "Minister of Ecclesiastical, Public Health Engineering & Water Resources"},
    {"name": "Arun Upreti", "state": "Sikkim", "portfolio": "Minister of Cooperation & Rural Development"},
    {"name": "Raju Basnet", "state": "Sikkim", "portfolio": "Minister of Education, Law, Sports & Youth Affairs"},
    {"name": "Tshering Thendup Bhutia", "state": "Sikkim", "portfolio": "Minister of Commerce, Industries, Tourism & Civil Aviation"},
    {"name": "Udhayanidhi Stalin", "state": "Tamil Nadu", "portfolio": "Deputy Chief Minister; Youth Welfare & Sports Development, Planning"},
    {"name": "Duraimurugan", "state": "Tamil Nadu", "portfolio": "Minister of Water Resources, Minerals & Mines"},
    {"name": "Thangam Thennarasu", "state": "Tamil Nadu", "portfolio": "Minister of Finance, Planning & Human Resources"},
    {"name": "K. N. Nehru", "state": "Tamil Nadu", "portfolio": "Minister of Municipal Administration & Urban Water Supply"},
    {"name": "Mallu Bhatti Vikramarka", "state": "Telangana", "portfolio": "Deputy Chief Minister; Finance & Planning, Energy"},
    {"name": "N. Uttam Kumar Reddy", "state": "Telangana", "portfolio": "Minister of Civil Supplies & Irrigation"},
    {"name": "D. Sridhar Babu", "state": "Telangana", "portfolio": "Minister of Information Technology, Industries & Commerce"},
    {"name": "Ponguleti Srinivas Reddy", "state": "Telangana", "portfolio": "Minister of Revenue, Housing & Information"},
    {"name": "Ratan Lal Nath", "state": "Tripura", "portfolio": "Minister of Power, Agriculture & Farmers' Welfare"},
    {"name": "Pranajit Singha Roy", "state": "Tripura", "portfolio": "Minister of Finance, Planning & Coordination"},
    {"name": "Santana Chakma", "state": "Tripura", "portfolio": "Minister of Industries & Commerce, Jail"},
    {"name": "Sushanta Chowdhury", "state": "Tripura", "portfolio": "Minister of Food, Civil Supplies, Transport & Tourism"},
    {"name": "Keshav Prasad Maurya", "state": "Uttar Pradesh", "portfolio": "Deputy Chief Minister; Rural Development & Food Processing"},
    {"name": "Brajesh Pathak", "state": "Uttar Pradesh", "portfolio": "Deputy Chief Minister; Medical Education & Health"},
    {"name": "Suresh Kumar Khanna", "state": "Uttar Pradesh", "portfolio": "Minister of Finance & Parliamentary Affairs"},
    {"name": "Swatantra Dev Singh", "state": "Uttar Pradesh", "portfolio": "Minister of Jal Shakti"},
    {"name": "Satpal Maharaj", "state": "Uttarakhand", "portfolio": "Minister of Public Works Department, Tourism & Irrigation"},
    {"name": "Premchand Aggarwal", "state": "Uttarakhand", "portfolio": "Minister of Finance, Urban Development & Parliamentary Affairs"},
    {"name": "Ganesh Joshi", "state": "Uttarakhand", "portfolio": "Minister of Agriculture, Rural Development & Sainik Kalyan"},
    {"name": "Dhan Singh Rawat", "state": "Uttarakhand", "portfolio": "Minister of Higher & School Education, Health & Family Welfare"},
    {"name": "Firhad Hakim", "state": "West Bengal", "portfolio": "Minister of Urban Development, Municipal Affairs & Housing"},
    {"name": "Chandrima Bhattacharya", "state": "West Bengal", "portfolio": "Minister of State (IC) of Finance & Health"},
    {"name": "Moloy Ghatak", "state": "West Bengal", "portfolio": "Minister of Law & Judicial"},
    {"name": "Arup Biswas", "state": "West Bengal", "portfolio": "Minister of Power, Housing & Youth Services and Sports"}
  ]
}

with open('server/data/leaders_cache.json', 'r', encoding='utf-8') as f:
    leaders = json.load(f)

updated_count = 0

def match_leader(search_name, state=None):
    search_parts = search_name.lower().split()
    best_match = None
    best_score = 0
    for l in leaders:
        if state and l.get('state') != state:
            continue
            
        lname = l.get('name', '').lower()
        if search_name.lower() in lname or lname in search_name.lower():
            return l
            
        score = sum([1 for p in search_parts if p in lname])
        if score > best_score and score >= len(search_parts) - 1: # generous match
            best_score = score
            best_match = l
    return best_match

# Update PM
pm = match_leader(data['prime_minister'])
if pm:
    pm['portfolio'] = 'Prime Minister of India'
    pm['currentDesignation'] = 'Prime Minister'
    pm.setdefault('careerTimeline', []).insert(0, {'year': '2014 - Present', 'title': 'Prime Minister of India', 'description': 'Serving as the Prime Minister of India.', 'place': 'New Delhi'})
    updated_count += 1

# Update Central Ministers
for min in data['cabinet_ministers']:
    l = match_leader(min['name'])
    if l:
        l['portfolio'] = min['portfolio']
        l['currentDesignation'] = min['portfolio'].split(';')[0]
        l.setdefault('careerTimeline', []).insert(0, {'year': '2024 - Present', 'title': min['portfolio'], 'description': 'Serving in the Union Council of Ministers.', 'place': 'New Delhi'})
        updated_count += 1

# Update State Ministers (Excluding CMs which were already handled)
for min in data['state_ministers']:
    if 'Chief Minister' in min['portfolio'] and 'Deputy' not in min['portfolio']:
        continue # Skip actual CMs since we updated them accurately before
        
    l = match_leader(min['name'], state=min['state'])
    if l:
        l['portfolio'] = min['portfolio']
        l['currentDesignation'] = min['portfolio'].split(';')[0]
        l.setdefault('careerTimeline', []).insert(0, {'year': 'Present', 'title': min['portfolio'], 'description': 'Serving in the state cabinet.', 'place': min['state']})
        updated_count += 1

with open('server/data/leaders_cache.json', 'w', encoding='utf-8') as f:
    json.dump(leaders, f, indent=2, ensure_ascii=False)

print(f"Successfully updated {updated_count} ministers in the directory!")
