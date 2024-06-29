import os
import sys
import json
import re
import glob
import subprocess
import time
import logging
from datetime import datetime
from tqdm import tqdm
from AzJsUrb import JsonOptimization
import argparse
import ast


# Set up logging
logging.basicConfig(filename='geojson_generation.log', level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')


def reset_updated_files():
    folders = ['../datas/urbanism/inputdepots', '../datas/urbanism/inputdecisions']
    total_deleted = 0

    for folder in folders:
        for filename in os.listdir(folder):
            if filename.endswith('_updated.json'):
                file_path = os.path.join(folder, filename)
                os.remove(file_path)
                total_deleted += 1
                print(f"Deleted: {file_path}")

    print(f"Total _updated files deleted: {total_deleted}")

def extract_date_from_filename(filename):
    match = re.search(r'(\d{4}\d{2}\d{2})', filename)
    if match:
        return datetime.strptime(match.group(1), '%Y%m%d')
    return datetime.min

def process_folder(folder_path, folder_name, force_update=False):
    json_files = [f for f in os.listdir(folder_path) if f.endswith('.json') and not f.endswith('_updated.json')]
    json_files.sort(key=extract_date_from_filename)

    processed = 0
    skipped = 0

    for filename in json_files:
        input_file = os.path.join(folder_path, filename)
        output_file = os.path.join(folder_path, filename.replace('.json', '_updated.json'))
        
        if not os.path.exists(output_file) or force_update:
            print(f"{folder_name}: Processing {filename}")
            JsonOptimization(input_file)
            processed += 1
        else:
            print(f"{folder_name}: Skipping {filename} (already has an _updated version)")
            skipped += 1

    return processed, skipped

def create_centralized_output():
    output_file = '../datas/urbanism/output.json'
    log_file = '../datas/urbanism/output_log.txt'
    history_file = '../datas/urbanism/output_history.json'

    unique_items = {}
    history = []

    all_files = glob.glob('../datas/urbanism/inputdepots/*_updated.json') + \
                glob.glob('../datas/urbanism/inputdecisions/*_updated.json')
    
    all_files.sort(key=os.path.getmtime, reverse=True)

    for file in all_files:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            for item in data:
                id_auth = item.get('id Autorisation')
                if id_auth and id_auth not in unique_items:
                    unique_items[id_auth] = item
                    history.append({
                        'id': id_auth,
                        'action': 'add',
                        'date': datetime.now().isoformat(),
                        'source_file': os.path.basename(file)
                    })
        except Exception as e:
            with open(log_file, 'a', encoding='utf-8') as log:
                log.write(f"Error processing file {file}: {str(e)}\n")

    # Write output file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(list(unique_items.values()), f, ensure_ascii=False, indent=2)

    # Write history file
    with open(history_file, 'w', encoding='utf-8') as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print(f"Centralized output created with {len(unique_items)} unique items.")

def run_scraper():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    scraper_path = os.path.join(script_dir, '..', 'scrapper', 'scrapper.js')
    
    print("Starting scraper...")
    start_time = time.time()
    
    try:
        # Create a progress bar
        with tqdm(total=100, desc="Scraping", unit="%") as pbar:
            process = subprocess.Popen(['node', scraper_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Update progress bar every second
            for i in range(40):  # 40 seconds total
                time.sleep(1)
                pbar.update(2.5)  # Increase by 2.5% each second (100% / 40 seconds)
                
                # Check if the process has finished
                if process.poll() is not None:
                    break
            
            # Ensure the progress bar reaches 100%
            pbar.update(100 - pbar.n)
        
        # Check the final status of the scraper
        returncode = process.wait(timeout=1)
        if returncode == 0:
            print("Scraper completed successfully.")
        else:
            print(f"Scraper encountered an error. Return code: {returncode}")
    except subprocess.TimeoutExpired:
        print("Scraper timed out after 40 seconds.")
    
    end_time = time.time()
    print(f"Scraper execution time: {end_time - start_time:.2f} seconds")

def process_scraped_data():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    force_update = '--force' in sys.argv
    inputdepots_path = os.path.join(script_dir, '..', 'datas', 'urbanism', 'inputdepots')
    inputdecisions_path = os.path.join(script_dir, '..', 'datas', 'urbanism', 'inputdecisions')

    total_processed = 0
    total_skipped = 0

    processed, skipped = process_folder(inputdepots_path, "depots", force_update)
    total_processed += processed
    total_skipped += skipped

    processed, skipped = process_folder(inputdecisions_path, "decisions", force_update)
    total_processed += processed
    total_skipped += skipped

    print(f"\nSummary:")
    print(f"Total files processed: {total_processed}")
    print(f"Total files skipped: {total_skipped}")

def reset_all_files():
    folders = ['../datas/urbanism/inputdepots', '../datas/urbanism/inputdecisions']
    total_deleted = 0

    for folder in folders:
        for filename in os.listdir(folder):
            if filename.endswith('_updated.json'):
                file_path = os.path.join(folder, filename)
                os.remove(file_path)
                total_deleted += 1
                print(f"Deleted: {file_path}")

    # Remove output.json and output_history.json
    output_files = ['../datas/urbanism/output.json', '../datas/urbanism/output_history.json']
    for file in output_files:
        if os.path.exists(file):
            os.remove(file)
            total_deleted += 1
            print(f"Deleted: {file}")

    print(f"Total files deleted: {total_deleted}")

def perform_action(action):
    if action == 0:
        run_scraper()
    elif action == 1:
        process_scraped_data()
    elif action == 2:
        create_centralized_output()
    elif action == 3:
        process_scraped_data()
        create_centralized_output()
    elif action == 4:
        reset_updated_files()
    elif action == 5:
        reset_all_files()
    elif action == 6:
        run_scraper()
        process_scraped_data()
        create_centralized_output()
    else:
        print("Invalid action. Please choose a number between 0 and 6.")

def interactive_menu():
    while True:
        choice = input("""Voulez vous :
Scraper les données (0) ?
Traiter les données scrapées (1) ?
Mettre à jour le fichier central (2) ?
Effectuer tous les traitements (3) ?
Raz des fichiers _updated (4) ?
Raz des fichiers _updated et de centralisation (5) ?
Scraper & effectuer tous les traitements (6) ?
Quit the tool (q/Q/enter) ?
Votre choix : """)

        if choice.lower() == 'q' or choice == '':
            print("Merci d'avoir utilisé l'outil. Au revoir!")
            break
        elif choice in ['0', '1', '2', '3', '4', '5', '6']:
            perform_action(int(choice))
        else:
            print("Choix invalide. Veuillez réessayer.")
        
        if choice.lower() != 'q' and choice != '':
            input("\nAppuyez sur Entrée pour retourner au menu principal...")



def parse_parcel_ref(parcel_ref):
    if isinstance(parcel_ref, list):
        return [parse_single_ref(ref) for ref in parcel_ref]
    return [parse_single_ref(parcel_ref)]

def parse_single_ref(ref):
    parts = ref.replace(' ', '').split(',')
    for part in parts:
        match = re.match(r'([A-Z]+)(\d+)', part)
        if match:
            section, numero = match.groups()
            return (section, numero)
    return None

def generate_geojson_layers():
    logging.info("Starting GeoJSON layer generation")
    print("Generating GeoJSON layers...")
    
    # Load the output.json file
    output_file = '../datas/urbanism/output.json'
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            urban_data = json.load(f)
    except FileNotFoundError:
        logging.error(f"Error: {output_file} not found.")
        print(f"Error: {output_file} not found. Please run option 2 to create the centralized output first.")
        return
    except json.JSONDecodeError:
        logging.error(f"Error: {output_file} is not a valid JSON file.")
        print(f"Error: {output_file} is not a valid JSON file.")
        return

    # Load the cadastre file
    cadastre_file = '../datas/geojson/cadastre-2A247-parcelles.json'
    try:
        with open(cadastre_file, 'r', encoding='utf-8') as f:
            cadastre_data = json.load(f)
    except FileNotFoundError:
        logging.error(f"Error: {cadastre_file} not found.")
        print(f"Error: {cadastre_file} not found.")
        return
    except json.JSONDecodeError:
        logging.error(f"Error: {cadastre_file} is not a valid JSON file.")
        print(f"Error: {cadastre_file} is not a valid JSON file.")
        return

    # Create dictionaries for depots and decisions
    depots = {"type": "FeatureCollection", "features": []}
    decisions = {"type": "FeatureCollection", "features": []}
    depots_orphans = []
    decisions_orphans = []

    # Create a lookup dictionary for cadastre parcels
    parcel_lookup = {(feature['properties']['section'], feature['properties']['numero']): feature for feature in cadastre_data['features']}

    # Process urban data and create GeoJSON features
    for item in tqdm(urban_data, desc="Processing items"):
        try:
            ref_parcelles = item.get('Ref Parcelle', [])
            parsed_refs = parse_parcel_ref(ref_parcelles)
            
            if not parsed_refs:
                logging.warning(f"Empty or invalid Ref Parcelle for item {item.get('id Autorisation')}")
                if item.get('status') == 'Depot':
                    depots_orphans.append(item)
                elif item.get('status') == 'Approved':
                    decisions_orphans.append(item)
                continue
            
            matched = False
            for parsed_ref in parsed_refs:
                if parsed_ref and parsed_ref in parcel_lookup:
                    cadastre_feature = parcel_lookup[parsed_ref]
                    feature = {
                        "type": "Feature",
                        "id": cadastre_feature['properties']['id'],
                        "geometry": cadastre_feature['geometry'],
                        "properties": {
                            "id": cadastre_feature['properties']['id'],
                            "commune": cadastre_feature['properties']['commune'],
                            "prefixe": cadastre_feature['properties']['prefixe'],
                            "section": cadastre_feature['properties']['section'],
                            "numero": cadastre_feature['properties']['numero'],
                            "contenance": cadastre_feature['properties']['contenance'],
                            "arpente": cadastre_feature['properties']['arpente'],
                            "created": cadastre_feature['properties']['created'],
                            "updated": cadastre_feature['properties']['updated'],
                        }
                    }
                    
                    urban_item = [
                        item.get('Affichage', ''),
                        item.get('id Autorisation', ''),
                        item.get('Dépot', ''),
                        item.get('Demandeur', ''),
                        item.get('Lieu', ''),
                        item.get('Surface', ''),
                        item.get('Travaux', ''),
                        item.get('Projet', ''),
                        item.get('decisionCplt', ''),
                        item.get('Ref Parcelle', ''),
                        item.get('Surface net', [0, 0]),
                        item.get('Lotissement', ''),
                        item.get('decision', ''),
                        item.get('IsIntrue', ''),
                        item.get('status', ''),
                        item.get('lastSeenDate', ''),
                        item.get('decisionDate', ''),
                        item.get('expiryDate', ''),
                        item.get('orphan', False),
                        item.get('Util1', ''),
                        item.get('Util2', '')
                    ]
                    
                    if item.get('status') == 'Depot':
                        if 'depots' not in feature['properties']:
                            feature['properties']['depots'] = []
                        feature['properties']['depots'].append(urban_item)
                        depots['features'].append(feature)
                    elif item.get('status') == 'Approved':
                        if 'decisions' not in feature['properties']:
                            feature['properties']['decisions'] = []
                        feature['properties']['decisions'].append(urban_item)
                        decisions['features'].append(feature)
                    matched = True
                    break
            
            if not matched:
                if item.get('status') == 'Depot':
                    depots_orphans.append(item)
                elif item.get('status') == 'Approved':
                    decisions_orphans.append(item)
                logging.warning(f"No matching parcel found for item {item.get('id Autorisation')}, Ref Parcelle: {ref_parcelles}")
        except Exception as e:
            logging.error(f"Error processing item: {e}")
            print(f"Error processing item: {e}")

    # Write GeoJSON files
    try:
        with open('../datas/urbanism/output_depots.geojson', 'w', encoding='utf-8') as f:
            json.dump(depots, f, ensure_ascii=False, indent=2)

        with open('../datas/urbanism/output_decisions.geojson', 'w', encoding='utf-8') as f:
            json.dump(decisions, f, ensure_ascii=False, indent=2)

        # Write orphan JSON files
        with open('../datas/urbanism/output_depots_orphans.json', 'w', encoding='utf-8') as f:
            json.dump(depots_orphans, f, ensure_ascii=False, indent=2)

        with open('../datas/urbanism/output_decisions_orphans.json', 'w', encoding='utf-8') as f:
            json.dump(decisions_orphans, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logging.error(f"Error writing output files: {e}")
        print(f"Error writing output files: {e}")
        return

    logging.info("GeoJSON layers and orphan files generated successfully")
    print(f"GeoJSON layers and orphan files generated successfully.")
    print(f"Depots (GeoJSON): {len(depots['features'])}")
    print(f"Decisions (GeoJSON): {len(decisions['features'])}")
    print(f"Depots orphans (JSON): {len(depots_orphans)}")
    print(f"Decisions orphans (JSON): {len(decisions_orphans)}")

    logging.info(f"Total items in output.json: {len(urban_data)}")
    print(f"Total items in output.json: {len(urban_data)}")

    # Debug: Print some information about orphans
    print("\nSample orphan items:")
    orphans = depots_orphans + decisions_orphans
    for i, item in enumerate(orphans[:5]):
        print(f"  {i+1}. ID: {item.get('id Autorisation')}, Status: {item.get('status')}, Ref Parcelle: {item.get('Ref Parcelle')}")


def display_statistics():
    print("Displaying statistics...")
    
    # Count files in inputdepots and inputdecisions
    inputdepots_path = '../datas/urbanism/inputdepots'
    inputdecisions_path = '../datas/urbanism/inputdecisions'
    
    depots_files = len([f for f in os.listdir(inputdepots_path) if f.endswith('.json')])
    decisions_files = len([f for f in os.listdir(inputdecisions_path) if f.endswith('.json')])
    
    # Count items in output.json
    output_file = '../datas/urbanism/output.json'
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            output_data = json.load(f)
            output_items = len(output_data)
    except FileNotFoundError:
        output_items = 0
    
    print(f"Nombre de fichiers dans inputdepots: {depots_files}")
    print(f"Nombre de fichiers dans inputdecisions: {decisions_files}")
    print(f"Nombre d'éléments dans output.json: {output_items}")



def main():
    while True:
        choice = input("""Voulez vous :
Scraper les données (0) ?
Traiter les données scrapées (1) ?
Mettre à jour le fichier central (2) ?
Effectuer tous les traitements (3) ?
Raz des fichiers _updated (4) ?
Raz des fichiers _updated et de centralisation (5) ?
Scraper & effectuer tous les traitements (6) ?
Afficher les statistiques (7) ?
Générer les couches GeoJSON (8) ?
Quit the tool (q/Q/enter) ?
Votre choix : """)

        if choice.lower() == 'q' or choice == '':
            print("Merci d'avoir utilisé l'outil. Au revoir!")
            break
        elif choice == '0':
            run_scraper()
        elif choice == '1':
            process_scraped_data()
        elif choice == '2':
            create_centralized_output()
        elif choice == '3':
            process_scraped_data()
            create_centralized_output()
        elif choice == '4':
            reset_updated_files()
        elif choice == '5':
            reset_updated_files()
            os.remove('../datas/urbanism/output.json')
            os.remove('../datas/urbanism/output_history.json')
            print("All _updated files and centralization files have been deleted.")
        elif choice == '6':
            run_scraper()
            process_scraped_data()
            create_centralized_output()
        elif choice == '7':
            display_statistics()
        elif choice == '8':
            generate_geojson_layers()
        else:
            print("Choix invalide. Veuillez réessayer.")
        
        if choice.lower() != 'q' and choice != '':
            input("\nAppuyez sur Entrée pour retourner au menu principal...")

if __name__ == "__main__":
    main()
