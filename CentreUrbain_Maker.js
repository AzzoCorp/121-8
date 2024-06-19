import geopandas as gpd
import json
from shapely.geometry import Point

# Charger les polygones des centres urbains
centres_urbains = gpd.read_file('GeoDatas/Urbanisation40.geojson')

# Charger les coordonnées des églises à partir du fichier JSON
with open('GeoDatas/eglises.json', 'r', encoding='utf-8') as f:
    eglises_data = json.load(f)

# Convertir les coordonnées des églises en objets Point
eglises_points = [Point(eglise['coordonnees']['longitude'], eglise['coordonnees']['latitude']) for eglise in eglises_data['eglises']]

# Créer un GeoDataFrame pour les églises
eglises_gdf = gpd.GeoDataFrame(geometry=eglises_points, crs="EPSG:4326")

# Reprojeter les centres urbains et les églises dans le même CRS si nécessaire
centres_urbains = centres_urbains.to_crs(epsg=4326)

# Vérifier si chaque centre urbain contient au moins une église
centres_urbains['contient_eglise'] = centres_urbains.geometry.apply(lambda x: any(x.contains(eglise) for eglise in eglises_gdf.geometry))

# Filtrer les centres urbains qui contiennent une église
centres_urbains_valides = centres_urbains[centres_urbains['contient_eglise']]

# Filtrer les centres urbains qui ne contiennent pas d'église
zones_non_qualifiees = centres_urbains[~centres_urbains['contient_eglise']]

# Sauvegarder les centres urbains valides en GeoJSON
centres_urbains_valides.to_file('GeoDatas/CentresUrbains.geojson', driver='GeoJSON')

# Sauvegarder les zones non qualifiées en GeoJSON
zones_non_qualifiees.to_file('GeoDatas/ZonesUrbaines.geojson', driver='GeoJSON')


