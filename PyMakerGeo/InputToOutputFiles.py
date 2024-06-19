import json
import re
import logging

logging.basicConfig(filename='process_log.log', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def extraire_references(texte):
    texte = re.sub(r'$$.*?$$', '', texte)
    pattern = r'\b[A-Z]{1,2} \d{1,5}\b'
    return re.findall(pattern, texte)

def count_geojson_items(geojson_data):
    return len(geojson_data['features'])

def count_json_items(json_data):
    return len(json_data['data'])

def extract_all_references(json_data):
    references = set()
    for record in json_data['data']:
        adresse = record[4]
        refs = extraire_references(adresse)
        for ref in refs:
            references.add(ref)
    return references

def extract_all_geojson_references(geojson_data, property_name):
    references = set()
    for feature in geojson_data['features']:
        if property_name in feature['properties']:
            for record in feature['properties'][property_name]:
                adresse = record[4]
                refs = extraire_references(adresse)
                for ref in refs:
                    references.add(ref)
    return references

with open('../GeoDatas/inputfavorables.json', 'r', encoding='utf-8') as file:
    favorables_data = json.load(file)
logging.info("Loaded inputfavorables.json")

with open('../GeoDatas/cadastre-2A247-parcelles.json', 'r', encoding='utf-8') as file:
    parcelles_data = json.load(file)
logging.info("Loaded cadastre-2A247-parcelles.json")

favorables_count = count_json_items(favorables_data)
parcelles_count = count_geojson_items(parcelles_data)

logging.info(f"Nombre d'éléments dans 'inputfavorables.json': {favorables_count}")
logging.info(f"Nombre d'éléments dans 'cadastre-2A247-parcelles.json': {parcelles_count}")

nouveau_geojson = {
    "type": "FeatureCollection",
    "features": []
}

favorables_par_reference = {}
favorables_no_references = []

for record in favorables_data['data']:
    adresse = record[4]
    references = extraire_references(adresse)
    if references:
        for ref in references:
            lettre, nombre = ref.split()
            ref_complete = f"{lettre} {nombre}"
            if ref_complete not in favorables_par_reference:
                favorables_par_reference[ref_complete] = []
            favorables_par_reference[ref_complete].append(record)
            logging.debug(f"Added record to favorables_par_reference[{ref_complete}]")
    else:
        favorables_no_references.append(record)
        logging.warning(f"No references found for record: {record}")

logging.info("Extracted references and decision information for favorables")

for feature in parcelles_data['features']:
    section = feature['properties'].get('section')
    numero = feature['properties'].get('numero')
    ref_parcelle = f"{section} {numero}"
    if ref_parcelle in favorables_par_reference:
        if 'decisions' not in feature['properties']:
            feature['properties']['decisions'] = []
        feature['properties']['decisions'].extend(favorables_par_reference[ref_parcelle])
        nouveau_geojson['features'].append(feature)
        logging.debug(f"Added feature with ref_parcelle {ref_parcelle} to nouveau_geojson")

logging.info("Selected corresponding polygons and added decision information for favorables")

nouveau_geojson_count = count_geojson_items(nouveau_geojson)
logging.info(f"Nombre d'éléments dans 'outputfavorables.geojson': {nouveau_geojson_count}")

with open('outputfavorablesT.geojson', 'w', encoding='utf-8') as file:
    json
