import json
import re

# Fonction pour extraire les références selon les règles spécifiées
def extraire_references(texte):
    pattern = r'\b[A-Z]{1,2} \d{1,5}\b'
    return re.findall(pattern, texte)

# Charger le fichier JSON des décisions
with open('inputdepots.json', 'r', encoding='utf-8') as file:
    depots_data = json.load(file)

with open('inputdecisions.json', 'r', encoding='utf-8') as file:
    decisions_data = json.load(file)

# Charger le fichier GeoJSON des parcelles
with open('cadastre-2A247-parcelles.json', 'r', encoding='utf-8') as file:
    parcelles_data = json.load(file)

# Nouvelle structure de données pour stocker les résultats
nouveau_geojson = {
    "type": "FeatureCollection",
    "features": []
}
nouveau_geojsonD = {
    "type": "FeatureCollection",
    "features": []
}

# Dictionnaire pour stocker les informations des décisions par référence
decisions_par_reference = {}
depots_par_reference = {}
# Extraire les références et les informations des décisions
for record in decisions_data['data']:
    adresse = record[4]
    references = extraire_references(adresse)
    
    # Si des références sont trouvées, les ajouter au dictionnaire
    if references:
        for ref in references:
            lettre, nombre = ref.split()
            ref_complete = f"{lettre} {nombre}"
            if ref_complete not in decisions_par_reference:
                decisions_par_reference[ref_complete] = []
            decisions_par_reference[ref_complete].append(record)

# Sélectionner les polygones correspondants dans le fichier GeoJSON des parcelles
for feature in parcelles_data['features']:
    section = feature['properties'].get('section')
    numero = feature['properties'].get('numero')
    
    ref_parcelle = f"{section} {numero}"
    
    if ref_parcelle in decisions_par_reference:
        # Ajouter les informations des décisions à la propriété du polygone
        feature['properties']['decisions'] = decisions_par_reference[ref_parcelle]
        nouveau_geojson['features'].append(feature)

# Sauvegarder les modifications dans un nouveau fichier GeoJSON
with open('output.geojson', 'w', encoding='utf-8') as file:
    json.dump(nouveau_geojson, file, ensure_ascii=False, indent=4)

# Générer le fichier JavaScript avec la variable "favorables"
with open('favorables.js', 'w', encoding='utf-8') as file:
    file.write('var favorables = ')
    json.dump(nouveau_geojson, file, ensure_ascii=False, indent=4)
    file.write(';')

print("Transformation terminée et fichiers 'output.geojson' et 'favorables.js' créés.")

# Extraire les références et les informations des décisions
for record in depots_data['data']:
    adresseD = record[4]
    referencesD = extraire_references(adresse)
    
    # Si des références sont trouvées, les ajouter au dictionnaire
    if referencesD:
        for ref in referencesD:
            lettre, nombre = ref.split()
            ref_completeD = f"{lettre} {nombre}"
            if ref_completeD not in depots_par_reference:
                depots_par_reference[ref_completeD] = []
            depots_par_reference[ref_completeD].append(record)

# Sélectionner les polygones correspondants dans le fichier GeoJSON des parcelles
for feature in parcelles_data['features']:
    section = feature['properties'].get('section')
    numero = feature['properties'].get('numero')
    
    ref_parcelle = f"{section} {numero}"
    
    if ref_parcelle in depots_par_reference:
        # Ajouter les informations des décisions à la propriété du polygone
        feature['properties']['decisions'] = depots_par_reference[ref_parcelle]
        nouveau_geojsonD['features'].append(feature)

# Sauvegarder les modifications dans un nouveau fichier GeoJSON
with open('outputD.geojson', 'w', encoding='utf-8') as file:
    json.dump(nouveau_geojsonD, file, ensure_ascii=False, indent=4)

# Générer le fichier JavaScript avec la variable "favorables"
with open('depots.js', 'w', encoding='utf-8') as file:
    file.write('var depots = ')
    json.dump(nouveau_geojsonD, file, ensure_ascii=False, indent=4)
    file.write(';')

print("Transformation terminée et fichiers 'outputD.geojson' et 'favorables.js' créés.")
