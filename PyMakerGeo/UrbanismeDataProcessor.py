import json
import re
from datetime import datetime
import os
import glob

def charger_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

def sauvegarder_json(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=4)

def nettoyer_reference(ref):
    return ref.replace('247 ', '').strip()

def extract_reference(address):
    if isinstance(address, list):
        return ', '.join(address)
    elif isinstance(address, str):
        parts = address.rsplit('(', 1)
        if len(parts) > 1:
            return parts[-1].strip(')')
    return None

def extract_areas(details):
    created_pattern = re.compile(r"Surface plancher cr[ée]ée\s*:\s*([\d,.]+)\s*m²")
    demolished_pattern = re.compile(r"Surface plancher démolie\s*:\s*([\d,.]+)\s*m²")
    
    created_match = created_pattern.search(details)
    demolished_match = demolished_pattern.search(details)
    
    construction_area = float(created_match.group(1).replace(',', '.')) if created_match else 0.0
    demolition_area = float(demolished_match.group(1).replace(',', '.')) if demolished_match else 0.0
    
    return construction_area, demolition_area

def process_record(record, is_depot=False):
    reference = extract_reference(record[4])
    details = record[7] if len(record) > 7 else ""
    construction_area, demolition_area = extract_areas(details)
    
    processed_record = record + [""] if is_depot else record
    processed_record.append(reference)
    processed_record.append([construction_area, demolition_area])
    
    if len(processed_record) > 8 and processed_record[8].startswith("Favorable le "):
        date_str = processed_record[8].split("Favorable le ")[1]
        try:
            date_obj = datetime.strptime(date_str, "%d/%m/%Y")
            processed_record[8] = 'Favorable'
            processed_record.append(date_obj.strftime("%Y-%d-%m"))
        except ValueError:
            processed_record[8] = ''
            processed_record.append('')
    else:
        if len(processed_record) <= 8:
            processed_record.append('')
        else:
            processed_record[8] = ''
        processed_record.append('')
    
    return processed_record, reference

def merge_and_process_data(data, is_depot=False):
    merged_data = []
    orphans = []
    total_records = 0
    total_references = 0
    unique_references = set()
    
    for record in data['data']:
        total_records += 1
        processed_record, reference = process_record(record, is_depot)
        if reference:
            refs = [nettoyer_reference(ref) for ref in reference.split(',') if ref.strip()]
            total_references += len(refs)
            unique_references.update(refs)
            merged_data.append(processed_record)
        else:
            orphans.append(processed_record)
    
    return merged_data, orphans, total_records, total_references, len(unique_references)

def associate_polygons(parcels_data, merged_data):
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    nbpol = 0
    references_traitees = set()
    orphans = []
    all_references = set()
    references_without_polygon = set()

    for record in merged_data:
        if record[-3]:  # Changed from -2 to -3 due to new field
            refs = [nettoyer_reference(ref) for ref in record[-3].split(',') if ref.strip()]
            all_references.update(refs)

    for feature in parcels_data['features']:
        section = feature['properties'].get('section')
        numero = feature['properties'].get('numero')
        parcel_ref = f"{section} {numero}"

        associated_records = []
        for record in merged_data:
            if record[-3] and parcel_ref in [nettoyer_reference(ref) for ref in record[-3].split(',')]:
                clean_record = record.copy()
                clean_record[-3] = ', '.join([nettoyer_reference(ref) for ref in clean_record[-3].split(',')])
                associated_records.append(clean_record)
                references_traitees.add(parcel_ref)

        if associated_records:
            nbpol += 1
            feature['properties']['urbanisme'] = associated_records
            geojson['features'].append(feature)

    for record in merged_data:
        if record[-3]:
            record_refs = [nettoyer_reference(ref) for ref in record[-3].split(',') if ref.strip()]
            if not any(ref in references_traitees for ref in record_refs):
                record.append("NotInCadastre")
                orphans.append(record)

    references_without_polygon = all_references - references_traitees

    return geojson, nbpol, orphans, references_traitees, references_without_polygon

def get_input_files(input_dir):
    pattern = os.path.join(input_dir, 'input_*.json')
    files = sorted(glob.glob(pattern))
    print(f"Files found in {input_dir}:")
    for file in files:
        print(f"  - {os.path.basename(file)}")
    return files

def process_input_files(depots_files, decisions_files):
    all_merged_data = []
    all_orphans = []
    total_records = 0
    total_references = 0
    unique_references = set()

    for file_type, files in [("depot", depots_files), ("decision", decisions_files)]:
        for file in files:
            print(f"Processing {file_type} file: {file}")
            data = charger_json(file)
            merged_data, orphans, records, references, unique = merge_and_process_data(data, file_type == "depot")
            print(f"Processed {records} records from {file}")
            print(f"Found {references} references and {unique} unique references")
            all_merged_data.extend(merged_data)
            all_orphans.extend(orphans)
            total_records += records
            total_references += references
            unique_references.update(unique)

    return all_merged_data, all_orphans, total_records, total_references, len(unique_references)

def main():
    depots_files = get_input_files('../geodatas/inputdepots')
    decisions_files = get_input_files('../geodatas/inputdecisions')
    parcels_data = charger_json('../GeoDatas/cadastre-2A247-parcelles.json')

    print(f"Found {len(depots_files)} depot files and {len(decisions_files)} decision files.")

    merged_data, initial_orphans, total_records, total_references, unique_references = process_input_files(depots_files, decisions_files)
    output_geojson, nbpol, cadastre_orphans, references_traitees, references_without_polygon = associate_polygons(parcels_data, merged_data)

    all_orphans = initial_orphans + cadastre_orphans
    
    sauvegarder_json('../GeoDatas/Output.geojson', output_geojson)
    sauvegarder_json('../GeoDatas/Orphans.json', {"recordsTotal": len(all_orphans), "data": all_orphans})

    print("Processing complete. Output saved to ../GeoDatas/Output.geojson")
    print(f"Total records processed: {total_records}")
    print(f"Total references found: {total_references}")
    print(f"Unique references: {unique_references}")
    print(f"Polygons with associated records: {nbpol}")
    print(f"Orphan records (no reference or not in cadastre): {len(all_orphans)}")
    print(f"References without corresponding polygon: {len(references_without_polygon)}")
    print(f"List of references without corresponding polygon: {', '.join(sorted(references_without_polygon))}")

if __name__ == "__main__":
    main()
