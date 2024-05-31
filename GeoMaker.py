import json
import re

# Fonction pour extraire les références selon les règles spécifiées
def extraire_references(texte):
    pattern = r'\b[A-Z]{1,2} \d{1,5}\b'
    return re.findall(pattern, texte)

# Charger le fichier JSON des décisions
with open('./GeoDatas/inputfavorables.json', 'r', encoding='utf-8') as file:
    favorables_data = json.load(file)

# Charger le fichier GeoJSON des parcelles
with open('./GeoDatas/cadastre-2A247-parcelles.json', 'r', encoding='utf-8') as file:
    parcelles_data = json.load(file)

# Nouvelle structure de données pour stocker les résultats
nouveau_geojson = {
    "type": "FeatureCollection",
    "features": []
}

# Dictionnaire pour stocker les informations des décisions par référence
favorables_par_reference = {}

# Extraire les références et les informations des décisions
for record in favorables_data['data']:
    adresse = record[4]
    references = extraire_references(adresse)
    
    # Si des références sont trouvées, les ajouter au dictionnaire
    if references:
        for ref in references:
            lettre, nombre = ref.split()
            ref_complete = f"{lettre} {nombre}"
            if ref_complete not in favorables_par_reference:
                favorables_par_reference[ref_complete] = []
            favorables_par_reference[ref_complete].append(record)

# Sélectionner les polygones correspondants dans le fichier GeoJSON des parcelles
for feature in parcelles_data['features']:
    section = feature['properties'].get('section')
    numero = feature['properties'].get('numero')
    
    ref_parcelle = f"{section} {numero}"
    
    if ref_parcelle in favorables_par_reference:
        # Ajouter les informations des décisions à la propriété du polygone
        feature['properties']['decisions'] = favorables_par_reference[ref_parcelle]
        nouveau_geojson['features'].append(feature)

# Sauvegarder les modifications dans un nouveau fichier GeoJSON
with open('./GeoDatas/outputfavorables.geojson', 'w', encoding='utf-8') as file:
    json.dump(nouveau_geojson, file, ensure_ascii=False, indent=4)

# Générer le fichier JavaScript avec la variable "favorables"
with open('./GeoDatas/favorables.js', 'w', encoding='utf-8') as file:
    file.write('var favorables = ')
    json.dump(nouveau_geojson, file, ensure_ascii=False, indent=4)
    file.write(';')

print("Transformation terminée et fichiers 'outputfavorables.geojson' et 'favorables.js' créés.")


# Charger le fichier JSON des décisions
with open('./GeoDatas/inputdepots.json', 'r', encoding='utf-8') as file:
    depots_data = json.load(file)

# Charger le fichier GeoJSON des parcelles
with open('./GeoDatas/cadastre-2A247-parcelles.json', 'r', encoding='utf-8') as file:
    parcelles_data = json.load(file)

# Nouvelle structure de données pour stocker les résultats
nouveau_geojson = {
    "type": "FeatureCollection",
    "features": []
}

# Dictionnaire pour stocker les informations des décisions par référence
depots_par_reference = {}

# Extraire les références et les informations des décisions
for record in depots_data['data']:
    adresse = record[4]
    references = extraire_references(adresse)
    
    # Si des références sont trouvées, les ajouter au dictionnaire
    if references:
        for ref in references:
            lettre, nombre = ref.split()
            ref_complete = f"{lettre} {nombre}"
            if ref_complete not in depots_par_reference:
                depots_par_reference[ref_complete] = []
            depots_par_reference[ref_complete].append(record)

# Sélectionner les polygones correspondants dans le fichier GeoJSON des parcelles
for feature in parcelles_data['features']:
    section = feature['properties'].get('section')
    numero = feature['properties'].get('numero')
    
    ref_parcelle = f"{section} {numero}"
    
    if ref_parcelle in depots_par_reference:
        # Ajouter les informations des décisions à la propriété du polygone
        feature['properties']['depots'] = depots_par_reference[ref_parcelle]
        nouveau_geojson['features'].append(feature)

# Sauvegarder les modifications dans un nouveau fichier GeoJSON
with open('./GeoDatas/outputDepots.geojson', 'w', encoding='utf-8') as file:
    json.dump(nouveau_geojson, file, ensure_ascii=False, indent=4)

# Générer le fichier JavaScript avec la variable "favorables"
with open('./GeoDatas/depots.js', 'w', encoding='utf-8') as file:
    file.write('var depots = ')
    json.dump(nouveau_geojson, file, ensure_ascii=False, indent=4)
    file.write(';')

print("Transformation terminée et fichiers 'outputdepots.geojson' et 'depots.js' créés.")
