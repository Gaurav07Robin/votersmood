import urllib.request
from bs4 import BeautifulSoup
import json

url = 'https://en.wikipedia.org/wiki/List_of_current_Indian_chief_ministers'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read()
soup = BeautifulSoup(html, 'html.parser')
table = soup.find('table', {'class': 'wikitable'})

cms = []
for row in table.find_all('tr')[1:]:
    cols = row.find_all(['th', 'td'])
    if len(cols) >= 4:
        state = cols[0].text.strip()
        name = cols[1].text.strip()
        # sometimes name is in cols[2] if image is in cols[1]
        if 'party' in name.lower() or name == '':
             name = cols[2].text.strip()
        cms.append({'state': state, 'name': name})

with open('scraped_cms.json', 'w', encoding='utf-8') as f:
    json.dump(cms, f, indent=2, ensure_ascii=False)
print("Scraped CMs to scraped_cms.json")
