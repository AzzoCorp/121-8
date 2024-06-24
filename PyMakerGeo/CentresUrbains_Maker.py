import geopandas as gpd
import json
from shapely.geometry import Point


centres_urbains = gpd.read_file('../GeoDatas/Urbanisation40.geojson')


with open('../GeoDatas/eglises.json', 'r', encoding='utf-8') as f:
    eglises_data = json.load(f)


eglises_points = [Point(eglise['coordonnees']['longitude'], eglise['coordonnees']['latitude']) for eglise in eglises_data['eglises']]


eglises_gdf = gpd.GeoDataFrame(geometry=eglises_points, crs="EPSG:4326")


centres_urbains = centres_urbains.to_crs(epsg=4326)

centres_urbains['contient_eglise'] = centres_urbains.geometry.apply(lambda x: any(x.contains(eglise) for eglise in eglises_gdf.geometry))




centres_urbains_valides = centres_urbains[centres_urbains['contient_eglise']]

zones_non_qualifiees = centres_urbains[~centres_urbains['contient_eglise']]


centres_urbains_valides.to_file('../GeoDatas/CentresUrbains.geojson', driver='GeoJSON')

zones_non_qualifiees.to_file('../GeoDatas/ZonesUrbaines.geojson', driver='GeoJSON')