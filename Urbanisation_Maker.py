import geopandas as gpd
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union

# Charger les polygones à partir du GeoJSON
batiments = gpd.read_file('GeoDatas/batiments.geojson')

# Vérifier le CRS actuel
print("CRS actuel :", batiments.crs)

# Reprojeter les géométries dans un CRS projeté (par exemple, Lambert 93 pour la France)
batiments = batiments.to_crs(epsg=2154)

# Créer un buffer de 80 mètres autour de chaque polygone
batiments['buffered'] = batiments.geometry.buffer(40)

# Fusionner les polygones qui se chevauchent
merged_polygons = unary_union(batiments['buffered'])

# Si merged_polygons est une collection de polygones, il faut les séparer
if isinstance(merged_polygons, MultiPolygon):
    merged_polygons = [poly for poly in merged_polygons.geoms]
else:
    merged_polygons = [merged_polygons]

# Créer un GeoDataFrame à partir des polygones fusionnés
result = gpd.GeoDataFrame(geometry=merged_polygons, crs=batiments.crs)

# Reprojeter les géométries dans le CRS d'origine (EPSG:4326)
result = result.to_crs(epsg=4326)

# Sauvegarder le résultat en GeoJSON
result.to_file('GeoDatas/Urbanisation40.geojson', driver='GeoJSON')
