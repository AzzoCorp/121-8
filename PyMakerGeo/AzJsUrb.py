import json
import os
import re
from datetime import datetime

def count_items(file_path):
    with open(file_path, 'r') as file:
        content = file.read()
        # Remove any JavaScript-specific syntax if present
        if content.strip().startswith(('var', 'const', 'let')):
            content = content.split('=', 1)[1].strip().rstrip(';')
        data = json.loads(content)
    
    if 'type' in data and data['type'] == 'FeatureCollection':
        return len(data['features'])
    elif 'data' in data:
        return len(data['data'])
    else:
        raise KeyError("Expected 'features' or 'data' key not found in JSON")

def count(file_path):
    try:
        item_count = count_items(file_path)
        return item_count
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
    except json.JSONDecodeError as e:
        print(f"Error: '{file_path}' is not a valid JSON or JavaScript file. Details: {str(e)}")
    except KeyError as e:
        print(f"Error: Missing expected key in JSON structure: {e}")
    except Exception as e:
        print(f"An unexpected error occurred with '{file_path}': {e}")
    return None

def load_parcel_references():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parcel_references_file = os.path.join(script_dir, '..', 'datas', 'json', 'cadastre-2A247-parcelles-only.json')
    try:
        with open(parcel_references_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return set(data['parcel_references'])
    except FileNotFoundError:
        print(f"Error: File not found: {parcel_references_file}")
        return set()

def extract_surface_net(projet):
    surfaces = re.findall(r'Surface plancher créée : ([\d,]+) m²|Surface plancher démolie : ([\d,]+) m²', projet)
    return [float(s[0].replace(',', '.') or s[1].replace(',', '.')) for s in surfaces]

def extract_lotissement(projet):
    match = re.search(r'Lotissement : (\d+) lot $$s$$', projet)
    return int(match.group(1)) if match else ""

def extract_decision(decision_cplt):
    if ' le ' in decision_cplt:
        decision, date = decision_cplt.split(' le ', 1)
        return decision.strip()
    else:
        return decision_cplt.strip()

def extract_date_decision(decision_cplt):
    if ' le ' in decision_cplt:
        decision, date = decision_cplt.split(' le ', 1)
        return date.strip()
    else:
        match = re.search(r'\b(\d{2}/\d{2}/\d{4})\b', decision_cplt)
        return match.group(1) if match else ""

def process_oldest_file(folder_path):
    json_files = [f for f in glob.glob(os.path.join(folder_path, '*.json')) if not f.endswith('_updated.json')]
    
    if json_files:
        # Extract date from filename and find the oldest
        oldest_file = min(json_files, key=lambda f: extract_date_from_filename(f))
        
        print(f"Processing file: {oldest_file}")
        output_file = JsonOptimization(oldest_file)
        if output_file:
            print(f"Processing complete. Output file: {output_file}")
        else:
            print(f"Failed to process {oldest_file}")
    else:
        print(f"No suitable JSON files found in {folder_path}")

def extract_date_from_filename(filename):
    # Extract date from filename (assuming format like 'input_YYYYMMDD.json')
    match = re.search(r'(\d{8})', os.path.basename(filename))
    if match:
        return datetime.strptime(match.group(1), '%Y%m%d')
    return datetime.min  # Return minimum date if no date found in filename

def process_latest_file(folder_path):
    json_files = glob.glob(os.path.join(folder_path, '*.json'))
    
    if json_files:
        # Sort files by date in descending order (newest first)
        latest_file = max(json_files, key=lambda f: os.path.basename(f).split('_')[1])
        
        if latest_file.endswith('_updated.json'):
            print(f"Most recent file is already updated: {latest_file}")
            return
        
        print(f"Processing file: {latest_file}")
        output_file = JsonOptimization(latest_file)
        if output_file:
            print(f"Processing complete. Output file: {output_file}")
        else:
            print(f"Failed to process {latest_file}")
    else:
        print(f"No JSON files found in {folder_path}")

def extract_parcelle(lieu):
    parcelles = []
    start = lieu.find('(')
    while start != -1:
        end = lieu.find(')', start)
        if end != -1:
            content = lieu[start+1:end]
            if not content.lower().startswith('lot'):
                refs = content.split(',')
                for ref in refs:
                    cleaned_ref = ref.strip()
                    while cleaned_ref and cleaned_ref[0].isdigit():
                        cleaned_ref = cleaned_ref[1:].strip()
                    if cleaned_ref:
                        parcelles.append(cleaned_ref)
            start = lieu.find('(', end)
        else:
            break
    return parcelles

def JsonOptimization(input_file):
    parcel_references = load_parcel_references()
    input_type = 'decision' if 'inputdecisions' in input_file else 'depot'
    
    filename = os.path.basename(input_file)
    file_date = filename.split('_')[1].split('.')[0]
    last_seen_date = datetime.strptime(file_date, "%Y%m%d").strftime("%d/%m/%Y")

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    updated_data = []
    
    if isinstance(data, dict) and 'data' in data:
        items = data['data']
    elif isinstance(data, list):
        items = data
    else:
        print(f"Unexpected data structure in {input_file}")
        return None

    for item in items:
        if isinstance(item, dict):
            updated_item = item.copy()
        elif isinstance(item, list):
            updated_item = {
                "Affichage": item[0] if len(item) > 0 else "",
                "id Autorisation": item[1] if len(item) > 1 else "",
                "Dépot": item[2] if len(item) > 2 else "",
                "Demandeur": item[3] if len(item) > 3 else "",
                "Lieu": item[4] if len(item) > 4 else "",
                "Surface": item[5] if len(item) > 5 else "",
                "Travaux": item[6] if len(item) > 6 else "",
                "Projet": item[7] if len(item) > 7 else "",
                "decisionCplt": item[8] if len(item) > 8 else "",
            }
        else:
            print(f"Skipping invalid item: {item}")
            continue

        parcelles = extract_parcelle(updated_item.get("Lieu", ""))
        is_intrue = [[parcelle, parcelle in parcel_references] for parcelle in parcelles]

        decision = extract_decision(updated_item.get("decisionCplt", ""))
        date_decision = extract_date_decision(updated_item.get("decisionCplt", ""))

        status = "Depot" if input_type == 'depot' else "Pending"
        if decision in ["Favorable", "Favorable tacite"]:
            status = "Approved"
        elif decision == "Sursis à statuer":
            status = "Pending"

        decision_date = date_decision if input_type == 'decision' else None
        if decision_date == "":
            decision_date = None

        updated_item.update({
            "Ref Parcelle": parcelles,
            "Surface net": extract_surface_net(updated_item.get("Projet", "")) or [0.0, 0.0],
            "Lotissement": extract_lotissement(updated_item.get("Projet", "")),
            "decision": decision,
            "IsIntrue": str(is_intrue),
            "status": status,
            "lastSeenDate": last_seen_date,
            "decisionDate": decision_date,
            "expiryDate": None,
            "orphan": not bool(parcelles),  # True if parcelles is empty, False otherwise
            "Util1": "",
            "Util2": ""
        })

        updated_data.append(updated_item)

    if not updated_data:
        print(f"No valid items found in {input_file}")
        return None

    output_filename = os.path.basename(input_file).replace('.json', '_updated.json')
    output_file = os.path.join(os.path.dirname(input_file), output_filename)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(updated_data, f, indent=2, ensure_ascii=False)

    print(f"Created updated file: {output_file}")
    orphan_count = sum(1 for item in updated_data if item["orphan"])
    print(f"Total items: {len(updated_data)}, Orphans: {orphan_count}")
    return output_file
