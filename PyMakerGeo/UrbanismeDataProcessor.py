#From file scrapped with scrapper.js to gejson layer of demandes and Décisions

import json
import re

def nettoyer_reference(ref):
    return ref.replace('247 ', '').strip()

def charger_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

def sauvegarder_json(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=4)

def extract_reference(address):
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

# ... (le reste du code reste inchangé)

def process_record(record, is_depot=False):
    reference = extract_reference(record[4])
    details = record[7] if len(record) > 7 else ""
    construction_area, demolition_area = extract_areas(details)
    
    record.append(reference)
    record.append([construction_area, demolition_area])  # Ajoutez toujours les surfaces
    
    return record, reference

def associer_polygones(parcelles_data, donnees_par_reference, type_donnees):
    nouveau_geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    nbpol = 0
    references_traitees = set()

    for feature in parcelles_data['features']:
        section = feature['properties'].get('section')
        numero = feature['properties'].get('numero')
        ref_parcelle = f"{section} {numero}"
        if ref_parcelle in donnees_par_reference:
            nbpol += 1
            feature['properties'][type_donnees] = []
            for record in donnees_par_reference[ref_parcelle]:
                new_record = record[:-1]  # Copie tous les éléments sauf le dernier
                if len(record) > 9 and isinstance(record[-1], list) and len(record[-1]) == 2:
                    new_record.append(record[-1])  # Ajoute le tableau [0.0, 0.0] à la fin
                else:
                    new_record.append([0.0, 0.0])  # Ajoute [0.0, 0.0] par défaut si les données sont manquantes
                feature['properties'][type_donnees].append(new_record)
            nouveau_geojson['features'].append(feature)
            references_traitees.add(ref_parcelle)

    return nouveau_geojson, nbpol, references_traitees



def segregate_records(records, is_depot=False):
    records_with_reference = []
    records_without_reference = []
    total_references = 0
    
    for record in records:
        processed_record, reference = process_record(record, is_depot)
        if reference:
            records_with_reference.append(processed_record)
            total_references += len(reference.split(','))
        else:
            records_without_reference.append(processed_record)
    
    return records_with_reference, records_without_reference, total_references

def extraire_references(data, is_depot):
    donnees_par_reference = {}
    total_records = 0
    total_references = 0
    unique_references = 0

    records_with_reference, records_without_reference, total_refs = segregate_records(data['data'], is_depot)
    total_records = len(records_with_reference) + len(records_without_reference)
    total_references = total_refs

    index_references = 8 if is_depot else 9
    for record in records_with_reference:
        references = [nettoyer_reference(ref) for ref in (record[index_references] or '').split(',') if ref.strip()]
        for ref in references:
            if ref not in donnees_par_reference:
                donnees_par_reference[ref] = []
                unique_references += 1
            donnees_par_reference[ref].append(record)

    return donnees_par_reference, total_records, total_references, unique_references, records_without_reference



def traiter_references_orphelines(donnees_par_reference, references_traitees, records_without_reference, is_depot):
    references_sans_correspondance = set(donnees_par_reference.keys()) - references_traitees
    print(f"Références sans correspondance : {list(references_sans_correspondance)}")
    elements_orphelins = len(records_without_reference)

    index_references = 8 if is_depot else 9
    for ref in references_sans_correspondance:
        for record in donnees_par_reference[ref]:
            references_record = set(nettoyer_reference(r) for r in record[index_references].split(',') if r.strip())
            if not references_record.intersection(references_traitees):
                record.append("NotInCadastre")
                records_without_reference.append(record)
                elements_orphelins += 1

    return records_without_reference, len(references_sans_correspondance), elements_orphelins

def traiter_donnees(type_donnees, is_depot):
    donnees_data = charger_json(f'../GeoDatas/input{type_donnees}.json')
    parcelles_data = charger_json('../GeoDatas/cadastre-2A247-parcelles.json')

    donnees_par_reference, total_records, total_references, unique_references, records_without_reference = extraire_references(donnees_data, is_depot)
    
    nouveau_geojson, nbpol, references_traitees = associer_polygones(parcelles_data, donnees_par_reference, type_donnees)
    
    records_without_reference, refs_sans_correspondance, elements_orphelins = traiter_references_orphelines(donnees_par_reference, references_traitees, records_without_reference, is_depot)

    sauvegarder_json(f'../GeoDatas/output{type_donnees}orphan.json', {"recordsTotal": len(records_without_reference), "data": records_without_reference})
    sauvegarder_json(f'../GeoDatas/output{type_donnees}.geojson', nouveau_geojson)

    with open(f'{type_donnees}.js', 'w', encoding='utf-8') as file:
        file.write(f'var {type_donnees} = ')
        json.dump(nouveau_geojson, file, ensure_ascii=False, indent=4)
        file.write(';')

    print(f"Traitement de {type_donnees} terminé:")
    print(f"  Nombre total d'enregistrements traités: {total_records}")
    print(f"  Nombre total de références trouvées: {total_references}")
    print(f"  Nombre de références uniques: {unique_references}")
    print(f"  Nombre de polygones correspondants: {nbpol}")
    print(f"  Références sans polygone correspondant: {refs_sans_correspondance}")
    print(f"  Éléments orphelins: {elements_orphelins}")

def main():
    traiter_donnees('favorables', False)
    traiter_donnees('depots', True)

if __name__ == "__main__":
    main()
