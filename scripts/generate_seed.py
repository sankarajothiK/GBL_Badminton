import zipfile, xml.etree.ElementTree as ET, re, json

def norm(name):
    return re.sub(r'[\s\.\(\)\-_]+', ' ', name).strip().upper()

docx_path = r'C:\Users\ADMIN\OneDrive\Desktop\details\CATEGORIES.docx'
doc_players = {}
with zipfile.ZipFile(docx_path) as z:
    tree = ET.fromstring(z.read('word/document.xml'))
    paragraphs = []
    for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
        texts = [t.text for t in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text]
        if texts: paragraphs.append(''.join(texts).strip())

i = 0
while i < len(paragraphs):
    val = paragraphs[i]
    if val.isdigit() and i + 4 < len(paragraphs):
        name = paragraphs[i+1]
        age = paragraphs[i+2]
        academy = paragraphs[i+3]
        cats = paragraphs[i+4]
        doc_players[norm(name)] = {
            'name': name.strip(),
            'age': int(age) if age.isdigit() else 35,
            'academy': academy.strip(),
            'cats': cats.strip()
        }
        i += 5
    else: i += 1

xlsx_path = r'C:\Users\ADMIN\OneDrive\Desktop\details\Untitled form (Responses).xlsx'
excel_players = []
with zipfile.ZipFile(xlsx_path) as z:
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
            shared_strings.append(''.join([t.text for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if t.text]))
    
    tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    rows = []
    for r in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
        row_vals = []
        for c in r.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
            t = c.get('t')
            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            val = v.text if v is not None else ''
            if t == 's' and val.isdigit(): val = shared_strings[int(val)]
            row_vals.append(val)
        rows.append(row_vals)

for r in rows[1:]:
    name = r[1].strip() if len(r) > 1 and r[1] else ''
    if not name: continue
    age = r[3].replace('.0','').strip() if len(r) > 3 and r[3] else '30'
    photo = r[4].strip() if len(r) > 4 and r[4] else ''
    cats = r[5].strip() if len(r) > 5 and r[5] else ''
    academy = r[6].strip() if len(r) > 6 and r[6] else ''
    phone = r[8].strip() if len(r) > 8 and r[8] else ''
    excel_players.append({
        'name': name,
        'age': int(age) if age.isdigit() else 30,
        'photo': photo,
        'cats': cats,
        'academy': academy,
        'phone': phone
    })

def map_categories(cat_str, age):
    cs = cat_str.upper()
    cats = []
    if 'ALL' in cs:
        return ['Open', '35+', 'Jumbled', '80+', 'Combined Doubles', 'Super Doubles', 'Challenges Doubles', 'Future Stars', 'Veterans Doubles']
    if 'OPEN' in cs:
        cats.append('Open')
    if '35' in cs:
        cats.append('35+')
        cats.append('Jumbled')
    if '80' in cs or 'COMBINED' in cs:
        cats.append('80+')
        cats.append('Combined Doubles')
    if 'SUPER' in cs or 'SD' in cs:
        cats.append('Super Doubles')
    if 'CHALLENG' in cs or 'CD' in cs:
        cats.append('Challenges Doubles')
    if 'FUTURE' in cs or 'FS' in cs:
        cats.append('Future Stars')
    if 'VETERAN' in cs:
        cats.append('Veterans Doubles')
    if not cats:
        if age >= 40:
            cats = ['35+', 'Veterans Doubles', '80+', 'Combined Doubles']
        elif age >= 35:
            cats = ['35+', 'Jumbled', 'Super Doubles']
        else:
            cats = ['Open', 'Super Doubles', 'Future Stars']
    return list(dict.fromkeys(cats))

seen = {}
for p in excel_players:
    k = norm(p['name'])
    if k not in seen:
        seen[k] = p
    else:
        if not seen[k]['photo'] and p['photo']: seen[k]['photo'] = p['photo']
        if not seen[k]['academy'] and p['academy']: seen[k]['academy'] = p['academy']

for k, d in doc_players.items():
    if k not in seen:
        seen[k] = {
            'name': d['name'],
            'age': d['age'],
            'photo': '',
            'cats': d['cats'],
            'academy': d['academy'],
            'phone': ''
        }
    else:
        if not seen[k]['academy'] and d['academy']: seen[k]['academy'] = d['academy']

stock_portraits = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80'
]

ts_players = []
for idx, (k, p) in enumerate(seen.items(), 1):
    pid = f'00000000-0000-0000-0002-{str(idx).zfill(12)}'
    pcode = f'GBL-{str(idx).zfill(3)}'
    cats = map_categories(p['cats'], p['age'])
    photo = p['photo']
    if not photo or 'drive.google' in photo:
        photo = stock_portraits[(idx - 1) % len(stock_portraits)]
    academy = p['academy'] or 'GBL Badminton Club'
    cat_summary = ', '.join(cats)
    ts_players.append({
        'id': pid,
        'tournament_id': '00000000-0000-0000-0000-000000000001',
        'player_code': pcode,
        'name': p['name'],
        'age': p['age'],
        'gender': 'Male',
        'mobile': p['phone'] or '+91 98840 00000',
        'photo_url': photo,
        'academy': academy,
        'eligible_category_ids': [],
        'eligible_category_names': cats,
        'achievements': f'Affiliated with {academy}. Registered for GBL 2026 Kovilpatti tournament.',
        'notes': f'Eligible for: {cat_summary}.',
        'registration_status': 'APPROVED',
        'auction_status': 'UNSOLD',
        'sold_price': None,
        'sold_team_id': None,
        'auction_order': idx,
        'created_at': '2026-09-06T00:00:00.000Z',
        'updated_at': '2026-09-06T00:00:00.000Z'
    })

with open('src/data/players_seed.json', 'w', encoding='utf-8') as fh:
    json.dump(ts_players, fh, indent=2)

print('SUCCESS: Created src/data/players_seed.json with count:', len(ts_players))
