import os
import msvcrt
import typer
from typing import List, Callable

def main_menu(options: List[str], actions: List[Callable], title: str = "Menu Principal"):
    menu_structure = create_menu_structure(options, actions, title)
    run_menu(menu_structure)

class MenuSystem:
    def clear_screen(self):
        os.system('cls' if os.name == 'nt' else 'clear')

    def print_menu(self, title, options, selected_index):
        self.clear_screen()
        typer.echo(typer.style(title, fg=typer.colors.BLUE, bold=True))
        typer.echo("─────────")
        for i, option in enumerate(options):
            option_label = option['label'] if isinstance(option, dict) else option
            # Remove any existing numbering from the option label
            option_label = option_label.split('. ', 1)[-1] if '. ' in option_label else option_label
            display_label = f"{i + 1}. {option_label}"
            if i == selected_index:
                typer.echo(typer.style(f"> {display_label}", fg=typer.colors.MAGENTA, bold=True))
            else:
                typer.echo(f"  {display_label}")

    def get_key(self):
        return msvcrt.getch()

    def menu_selection(self, title, options):
        selected_index = 0
        while True:
            self.print_menu(title, options, selected_index)
            key = self.get_key()
            if key == b'\r':  # Enter key
                return selected_index
            elif key == b'\x1b':  # Escape key
                return 'escape'
            elif key == b'H':  # Up arrow
                selected_index = (selected_index - 1) % len(options)
            elif key == b'P':  # Down arrow
                selected_index = (selected_index + 1) % len(options)

def create_menu_structure(options, actions, title, path='', is_submenu=False):
    menu_system = MenuSystem()
    options_with_indicator = []

    for option, action in zip(options, actions):
        if isinstance(action, dict):
            if isinstance(option, dict):
                # Remove any existing '+' before adding a new one
                option['label'] = option['label'].rstrip(' +') + ' +'
                options_with_indicator.append(option)
            else:
                # Remove any existing '+' before adding a new one
                options_with_indicator.append(option.rstrip(' +') + ' +')
        else:
            # Remove any existing '+' from non-submenu options
            options_with_indicator.append(option.rstrip(' +') if isinstance(option, str) else option)

    return {
        "title": f"{path} {title}".strip(),
        "options": options_with_indicator,
        "actions": actions,
        "menu_system": menu_system,
        "is_submenu": is_submenu,
        "path": path
    }



def run_menu(menu_structure, item_path=None):
    menu_system = menu_structure["menu_system"]
    if item_path:
        execute_menu_item(menu_structure, item_path)
    else:
        while True:
            selected_index = menu_system.menu_selection(menu_structure["title"], menu_structure["options"])
            if selected_index == 'escape':
                break
            action = menu_structure["actions"][selected_index]
            if callable(action):
                action()
                input("\nPress Enter to return to the menu...")
            elif isinstance(action, dict):
                new_path = f"{menu_structure['path']}{selected_index + 1}."
                run_menu(create_menu_structure(action["options"], action["actions"], action["title"], new_path, True))

def create_submenu(options, actions, title):
    submenu_options = [{"label": option} for option in options]
    return create_menu_structure(submenu_options, actions, title, is_submenu=True)

def execute_menu_item(menu_structure, item_path):
    path_parts = item_path.split('.')
    current_menu = menu_structure
    for part in path_parts:
        try:
            index = int(part) - 1
            action = current_menu["actions"][index]
            if callable(action):
                action()
                return
            elif isinstance(action, dict):
                current_menu = action
            else:
                raise ValueError("Invalid menu path")
        except (ValueError, IndexError):
            typer.echo(typer.style("Invalid menu path", fg=typer.colors.RED))
            return
