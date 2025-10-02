# STEP 2: IMPORTS AND CONFIGURATION

import requests
from bs4 import BeautifulSoup
import re
import io
import os
import sys
import numpy as np
import cv2
import pytesseract
import exifread
import json
import time
import random
from colorama import init, Fore, Style

# Initialize colorama for cross-platform color support
init(autoreset=True)

try:
    from PIL import Image
    from PIL.ExifTags import TAGS
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# Set the path to the Tesseract executable installed by apt-get
# NOTE: Ensure Tesseract is installed on your system (e.g., sudo apt-get install tesseract-ocr)
try:
    pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'
    print(f"{Fore.GREEN}✅ Setup Complete. Starting CLI...")
except pytesseract.TesseractNotFoundError:
    print(f"{Fore.RED}❌ Tesseract executable not found. OCR functionality will fail.")
    print(f"{Fore.RED}   Please install Tesseract and update the path if necessary.")

# === CONFIGURATION FOR LEAK OSINT (Source 2) ===
# NOTE: Replace with your actual token for use!
API_TOKEN = ""
LANG = "ru"
LIMIT = 300
URL = "https://leakosintapi.com/"

# -----------------------------------------------
# STEP 3: HELPER FUNCTIONS (General)
# -----------------------------------------------

def format_dict_output(title, details):
    """Formats a dictionary of results for console output with colors."""
    output = f"\n{Fore.CYAN}{title}\n"
    output += f"{Fore.CYAN}{'=' * len(title)}\n"

    if isinstance(details, dict):
        for key, value in details.items():
            if isinstance(value, dict):
                output += f"{Fore.YELLOW}- {key}:\n"
                for sub_key, sub_value in value.items():
                    output += f"{Fore.WHITE}     > {sub_key}: {sub_value}\n"
            else:
                if isinstance(value, (list, tuple)):
                    value = ', '.join(map(str, value))
                output += f"{Fore.YELLOW}- {key}: {Fore.LIGHTBLUE_EX}{value}\n"
    else:
        output += f"{Fore.WHITE}{details}\n"
    output += f"{Fore.CYAN}{'=' * len(title)}\n"
    return output

def handle_terminal_image_upload():
    """Prompts user to enter a file path and reads the image file data."""
    print(f"\n{Fore.YELLOW}--- Image File Path Required ---")
    try:
        # Get the file path from the user
        file_path = input(f"{Fore.LIGHTGREEN_EX}Enter the path to the image file: {Style.RESET_ALL}").strip()

        if not file_path:
            print(f"{Fore.RED}❌ No file path entered. Returning to menu.")
            return None, None

        # Check if the file exists
        if not os.path.exists(file_path):
            print(f"{Fore.RED}❌ File not found at path: '{file_path}'")
            return None, None

        # Read the file's binary data
        with open(file_path, 'rb') as f:
            image_data = f.read()

        file_name = os.path.basename(file_path)

        print(f"{Fore.GREEN}✅ File '{file_name}' loaded successfully.")
        return file_name, image_data

    except PermissionError:
        print(f"{Fore.RED}❌ Permission denied to read the file.")
        return None, None
    except IsADirectoryError:
        print(f"{Fore.RED}❌ The path provided is a directory, not a file.")
        return None, None
    except Exception as e:
        print(f"{Fore.RED}❌ Error during file reading: {e}")
        return None, None


def type_effect(text, delay=0.002):
    """Typing animation effect."""
    for char in str(text):
        print(char, end='', flush=True)
        time.sleep(delay)
    print()

def format_as_js(data):
    """Formats a dictionary as a JavaScript-style object for output with colors."""
    js_lines = []
    for key, value in data.items():
        key_str = f"{Fore.YELLOW}{key}"
        value_str = f"{Fore.WHITE}{json.dumps(value, ensure_ascii=False)}"
        js_lines.append(f"    {key_str}: {value_str}")
    return "{\n" + ",\n".join(js_lines) + "\n}"

def print_colored(text, delay=0.005):
    """Prints text in a random color with a typing delay."""
    colors = [Fore.YELLOW, Fore.CYAN, Fore.MAGENTA, Fore.LIGHTBLUE_EX, Fore.LIGHTGREEN_EX]
    for line in str(text).splitlines():
        color = random.choice(colors)
        for char in line:
            print(color + char, end='', flush=True)
            time.sleep(delay)
        print()


# STEP 4: CORE OSINT FUNCTIONS

def trace_number(phone_number_in):
    """
    Trace phone number using calltracer.in. (Source 1)
    """
    phone_number = re.sub(r'^\+91|\s|-', '', phone_number_in).strip()

    if not re.match(r'^\d{10,12}$', phone_number):
          return f"⚠️ Invalid format. Cleaned number '{phone_number}' is not a valid 10-12 digit number."

    url = "https://calltracer.in"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    payload = {"country": "IN", "q": phone_number}

    try:
        response = requests.post(url, headers=headers, data=payload, timeout=15)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            details = {"📞 Number (Input)": phone_number_in, "📞 Number (Cleaned)": phone_number}

            tags = ["Owner Name", "Owner Address", "Hometown", "Refrence City", "Mobile Locations", "Tower Locations", "Country", "Mobile State", "SIM card", "IMEI number", "MAC address", "Connection", "IP address" , "Owner Personality", "Language" , "Tracking History", "Tracker Id", "Complaints"]

            for tag in tags:
                element = soup.find(string=tag)
                details[f"❗️ {tag}"] = element.find_next("td").text.strip() if element and element.find_next("td") else "N/A"

            return details
        else:
            return f"⚠️ Failed to fetch data. HTTP Status Code: {response.status_code}"
    except Exception as e:
        return f"❌ An error occurred: {str(e)}"

# --- New/Updated Vehicle Lookup Functions ---

def get_vehicle_details_vahanx(rc_number: str) -> dict:
    """Fetches comprehensive vehicle details from vahanx.in (Source 2 / Fallback)."""
    rc = rc_number.strip().upper()
    url = f"https://vahanx.in/rc-search/{rc}"

    headers = {
        "Host": "vahanx.in", "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9", "Referer": "https://vahanx.in/rc-search"
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error from vahanx.in: {e}"}
    except Exception as e:
        return {"error": str(e)}

    def get_value(label):
        try:
            div = soup.find("span", string=label).find_parent("div")
            return div.find("p").get_text(strip=True)
        except AttributeError:
            return None

    data = {
        "Owner Name": get_value("Owner Name"),
        "Father's Name": get_value("Father's Name"),
        "Owner Serial No": get_value("Owner Serial No"),
        "Model Name": get_value("Model Name"),
        "Registration Date": get_value("Registration Date"),
        "Insurance Expiry": get_value("Insurance Expiry"),
        "Fitness Upto": get_value("Fitness Upto"),
        "Tax Upto": get_value("Tax Upto"),
        "Financier Name": get_value("Financier Name"),
        "Registered RTO": get_value("Registered RTO"),
        "Address": get_value("Address"),
    }

    # Filter out empty or 'N/A' values
    filtered_data = {k: v for k, v in data.items() if v and v.strip().upper() not in ('N/A', 'NONE')}

    if not filtered_data:
        return {"error": "No meaningful details found on vahanx.in."}

    return filtered_data


def lookup_vehicle_info_api(vehicle_number):
    """Vehicle information lookup using vercel API (Source 1 / Primary)."""
    api_url = f'https://vahan-api.vercel.app/api/vehicle/{vehicle_number}'
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

    try:
        response = requests.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data and isinstance(data, dict) and data.get('data'):
            info = data['data']
            return {
                "Vehicle Number": info.get('registrationNumber', vehicle_number),
                "Owner Name": info.get('ownerName', 'N/A'),
                "Registration Date": info.get('registrationDate', 'N/A'),
                "Make & Model": info.get('makeModel', 'N/A'),
                "Fuel Type": info.get('fuelType', 'N/A'),
                "Vehicle Class": info.get('vehicleClass', 'N/A'),
                "RTO Office": info.get('rtoOffice', 'N/A'),
                "Chassis No (Partial)": info.get('chassisNumber', 'N/A')[-4:],
                "Engine No (Partial)": info.get('engineNumber', 'N/A')[-4:],
            }
        else:
            return {"error": "API returned no data or an unexpected format."}

    except requests.exceptions.RequestException as e:
        return {"error": f"API call failed: {e}"}
    except Exception as e:
        return {"error": f"An unexpected error occurred: {str(e)}"}

def concurrent_vehicle_osint(vehicle_number):
    """Finds from oublic db (Source 1) and Vahan Scraper (leak) (Source 2) for a vehicle number."""

    # --- RUNNING SOURCE 1: VERCEL API ---
    print(f"\n\n{Fore.CYAN}--- RUNNING SOURCE 1: OPEN-SOURCE LOOKUP (Primary) ---")
    api_result = lookup_vehicle_info_api(vehicle_number)
    print(format_dict_output(f"🚗 SOURCE 1: Vehicle Details for {vehicle_number}", api_result))

    # --- RUNNING SOURCE 2: VAHAN SCRAPER ---
    print(f"\n\n{Fore.CYAN}--- RUNNING SOURCE 2: Vahan Scraper LEAKD DB (Fallback) ---")
    scraper_result = get_vehicle_details_vahanx(vehicle_number)
    print(format_dict_output(f"🚗 SOURCE 2: Vehicle Details for {vehicle_number}", scraper_result))

# --- End New/Updated Vehicle Lookup Functions ---


def lookup_ip_info(ip_address):
    """Retrieve detailed geographical and network information for an IP address. (Source 1)"""
    url = f"http://ip-api.com/json/{ip_address}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query"

    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()

        if data.get("status") == "success":
            return {
                "IP Address": data.get("query"),
                "Country": f"{data.get('country')} ({data.get('countryCode')})",
                "Region/State": f"{data.get('regionName')} ({data.get('region')})",
                "City": data.get("city"),
                "Postal Code": data.get("zip"),
                "Timezone": data.get("timezone"),
                "ISP": data.get("isp"),
                "Organization": data.get("org"),
                "AS Number/Name": data.get("as"),
                "Coordinates": f"Lat: {data.get('lat')}, Lon: {data.get('lon')}",
            }
        else:
            return f"IP lookup failed. Message: {data.get('message', 'Unknown error')}"

    except requests.exceptions.RequestException as e:
        return f"❌ An error occurred during IP lookup: {str(e)}"

def lookup_ifsc_info(ifsc_code):
    """Retrieve bank and branch details for an IFSC code. (Source 1)"""
    url = f"https://ifsc.razorpay.com/{ifsc_code}"

    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()

        if data.get("BANK"):
            return {
                "Bank Name": data.get("BANK"),
                "Branch": data.get("BRANCH"),
                "Address": data.get("ADDRESS"),
                "City": data.get("CITY"),
                "District": data.get("DISTRICT"),
                "State": data.get("STATE"),
                "IFSC Code": data.get("IFSC"),
                "MICR Code": data.get("MICR"),
                "Contact": data.get("CONTACT", "N/A"),
                "UPI": "Enabled" if data.get("UPI") else "Disabled",
            }
        else:
             return f"⚠️ IFSC code **`{ifsc_code}`** not found or is invalid."
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
             return f"⚠️ IFSC code `{ifsc_code}` not found or is invalid (HTTP 404)."
        return f"❌ HTTP Error during IFSC lookup: {e.response.status_code}"
    except requests.exceptions.RequestException as e:
        return f"❌ An error occurred during IFSC lookup: {str(e)}"
    except Exception as e:
        return f"❌ An unexpected error occurred: {str(e)}"

def extract_exif_data(image_data):
    """Extract EXIF metadata from image bytes using PIL and exifread. (Source 1)"""
    if not PIL_AVAILABLE:
        return "❌ Image processing dependencies (Pillow) are not available."

    results = {}
    try:
        f = io.BytesIO(image_data)
        tags = exifread.process_file(f, details=False, strict=False)

        for tag_name, tag_value in tags.items():
            if 'Thumbnail' not in tag_name:
                results[tag_name] = str(tag_value)

    except Exception as e:
        results['Exif_Error'] = f"Exif extraction failed: {e}"

    if not results or (len(results) == 1 and 'Exif_Error' in results):
          return "ℹNo metadata found in the image."

    return results

def extract_text_from_image(image_data):
    """Extract text from image bytes using OpenCV and Tesseract. (Source 1)"""
    try:
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return "❌ Could not decode image data."

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        text = pytesseract.image_to_string(gray, lang='eng')

        if not text.strip():
            text = pytesseract.image_to_string(gray, lang='eng', config='--psm 6')

        if not text.strip():
            return "⚠️ No readable text found in the image."

        return text.strip()

    except Exception as e:
        return f"❌ An error occurred during OCR: {str(e)}"

def generate_report(query):
    """
    Queries the Leak Database for information based on the input query. (Source 2)
    This function will automatically prefix a 10-12 digit number with +91.
    """
    processed_query = query.strip()

    if re.match(r'^\+?\d{10,12}$', processed_query):
        cleaned_number = re.sub(r'^\+91', '', processed_query)
        processed_query = "+91" + cleaned_number.lstrip('+')
        search_target_display = f"{query} (Searching as: {processed_query})"
    else:
        search_target_display = query


    data = {
        "token": API_TOKEN,
        "request": processed_query,
        "limit": LIMIT,
        "lang": LANG
    }

    try:
        print(f"\n{Fore.YELLOW}[ Retriving Data (database 2) for '{search_target_display}' ]")

        response = requests.post(URL, json=data, timeout=20).json()

        if "Error code" in response:
            print(f"{Fore.RED}\n🚫 API Error: {response['Error code']}")
            return

        if "List" not in response:
             print(f"{Fore.RED}\n🚫 API Error: Unexpected response format from API.")
             return

        results_found = False
        for db in response["List"].keys():
            if db.lower() == "no results found":
                continue

            results_found = True
            db_title = "STARK (1WIN)" if db.lower() == "1win" else db
            db_name = f"\n=== [ SOURCE 2: LEAK DATABASE: {db_title} ] ===\n"
            type_effect(f"{Fore.LIGHTRED_EX}{db_name}")

            for entry in response["List"][db]["Data"]:
                formatted = format_as_js(entry)
                print_colored(formatted)

        if not results_found:
            type_effect(f"\n{Fore.GREEN}✅ SOURCE 2: No leaked data found for '{search_target_display}'.")

    except requests.exceptions.RequestException as e:
        print(f"{Fore.RED}\n❌ API CONNECTION ERROR: {e}")
    except Exception as e:
        print(f"{Fore.RED}\n❌ An unexpected error occurred in Source 2: {e}")

def concurrent_number_osint(phone_number_in):
    """Runs Source 1 (Trace) and Source 2 (Leak) for a phone number concurrently."""

    # --- RUNNING SOURCE 1: CALL TRACE ---
    print(f"\n\n{Fore.CYAN}--- RUNNING SOURCE 1: CALL TRACE ---")
    trace_result = trace_number(phone_number_in)
    print(format_dict_output(f"📞 SOURCE 1: Number Trace Results for {phone_number_in}", trace_result))

    # --- RUNNING SOURCE 2: LEAK CHECK ---
    print(f"\n\n{Fore.CYAN}--- RUNNING SOURCE 2: LEAK CHECK ---")
    generate_report(phone_number_in)

def post_search_menu():
    """Asks the user to re-search or exit."""
    while True:
        print(f"\n{Fore.YELLOW}------------------------------------------------------")
        print(f"{Fore.YELLOW}[{Fore.WHITE}1{Fore.YELLOW}] Re-Search")
        print(f"{Fore.YELLOW}[{Fore.WHITE}2{Fore.YELLOW}] Exit")
        choice = input(f"{Fore.LIGHTGREEN_EX}Enter your choice: ").strip()
        if choice == '1':
            return True
        elif choice == '2':
            return False
        else:
            print(f"{Fore.RED}❌ Invalid choice. Please enter '1' or '2'.")


# -----------------------------------------------
# STEP 5: INTERACTIVE CLI
# -----------------------------------------------

def display_menu():
    """Displays the main menu options with colors."""
    # Use os.system("clear") if you want to clear the screen on each menu refresh
    print("\n" * 2) # Add some spacing
    menu = f"""{Fore.RED}{Style.BRIGHT}
{Fore.YELLOW}======================================================
{Fore.WHITE}
      ███████╗████████╗  █████╗  █████╗ ██╗  ██╗
      ██╔════╝   ██╔══╝██╔══██╗██╔══██╗ ██║ ██╔╝
      ███████╗   ██║   ███████║██████╔╝ █████╔╝
      ╚════██║   ██║   ██╔══██║██╔══██╗ ██╔═██╗
      ███████║   ██║   ██║  ██║██║  ██║ ██║  ██╗
      ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═╝  ╚═╝
     {Fore.LIGHTCYAN_EX}          OSINT CLI by STARK
{Fore.YELLOW}======================================================
{Fore.WHITE}
{Fore.GREEN}--- SOURCE 1: OPEN-SOURCE LOOKUPS ---
{Fore.CYAN}[{Fore.WHITE}1{Fore.CYAN}] Concurrent Phone OSINT (Trace & Leaks)
    (e.g., 9876543210 without +91 )
{Fore.CYAN}[{Fore.WHITE}2{Fore.CYAN}] Concurrent Vehicle Info (API & Scraper) 🔥
{Fore.CYAN}[{Fore.WHITE}3{Fore.CYAN}] Lookup IP Address (Source 1 only)
{Fore.CYAN}[{Fore.WHITE}4{Fore.CYAN}] Lookup IFSC Code (Source 1 only)
{Fore.CYAN}[{Fore.WHITE}5{Fore.CYAN}] Analyze Image (Source 1 only)
{Fore.GREEN}
--- SOURCE 2: LEAKED DATABASE ---
{Fore.CYAN}[{Fore.WHITE}6{Fore.CYAN}] Check for Leaks ONLY (Email, Usernames, etc.)
{Fore.RED}
{Fore.CYAN}[{Fore.WHITE}7{Fore.CYAN}] Exit
{Fore.YELLOW}------------------------------------------------------{Style.RESET_ALL}
"""
    print(menu)

def run_cli():
    """The main loop for the command-line interface."""
    while True:
        display_menu()
        choice = input(f"{Fore.MAGENTA}Enter your choice (1-7): {Style.RESET_ALL}").strip()

        try:
            if choice == '1':
                param = input(f"{Fore.LIGHTGREEN_EX}Enter Indian Phone Number: {Style.RESET_ALL}").strip()
                if not re.match(r'^\+?\d{10,14}$', param.replace(' ', '')):
                    print(f"{Fore.RED}⚠️ Invalid format. Use a 10-digit number, optionally with +91.")
                    continue
                concurrent_number_osint(param)

            elif choice == '2':
                param = input(f"{Fore.LIGHTGREEN_EX}Enter Vehicle Number (e.g., MH12AB1234): {Style.RESET_ALL}").strip().upper()
                if not re.match(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{0,2}[0-9]{4}$', param):
                    print(f"{Fore.RED}⚠️ Invalid format. Check the vehicle number format.")
                    continue
                concurrent_vehicle_osint(param)

            elif choice == '3':
                param = input(f"{Fore.LIGHTGREEN_EX}Enter IP Address (e.g., 1.1.1.1): {Style.RESET_ALL}").strip()
                if not re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', param):
                    print(f"{Fore.RED}⚠️ Invalid IP address format.")
                    continue
                result = lookup_ip_info(param)
                print(format_dict_output(f"🌐 SOURCE 1: IP Details for {param}", result))

            elif choice == '4':
                param = input(f"{Fore.LIGHTGREEN_EX}Enter IFSC Code (e.g., HDFC0000001): {Style.RESET_ALL}").strip().upper()
                if not re.match(r'^[A-Z]{4}0[A-Z0-9]{6}$', param):
                    print(f"{Fore.RED}⚠️ Invalid IFSC code format (e.g., HDFC0000001).")
                    continue
                result = lookup_ifsc_info(param)
                print(format_dict_output(f"🏦 SOURCE 1: IFSC Details for {param}", result))

            elif choice == '5':
                # *** MODIFIED FOR TERMINAL USE ***
                file_name, image_data = handle_terminal_image_upload()
                if image_data:
                    exif_results = extract_exif_data(image_data)
                    print(format_dict_output(f"🖼 SOURCE 1: EXIF / Metadata for {file_name}", exif_results))
                    ocr_text = extract_text_from_image(image_data)
                    print(f"\n{Fore.CYAN}📄 SOURCE 1: OCR / Text Extraction for {file_name}\n" + "=" * 40 + "\n")
                    print(f"{Fore.WHITE}{ocr_text}{Style.RESET_ALL}")
                    print(f"{Fore.CYAN}{'=' * 40}{Style.RESET_ALL}")

            elif choice == '6':
                print(f"{Fore.BLUE}\n[+] Send Your Target Query (email, phone, username, etc.):")
                target = input(f"{Fore.LIGHTGREEN_EX}Target ➤ {Style.RESET_ALL}")
                if not target:
                    print(f"{Fore.RED}❌ Target cannot be empty.")
                    continue
                generate_report(target)

            elif choice == '7':
                print(f"{Fore.YELLOW}Exiting CLI. Goodbye! 👋")
                print(f"{Fore.YELLOW}Made by Stark ( urstark.vercel.app )")
                break

            else:
                print(f"{Fore.RED}❌ Invalid choice. Please enter a number between 1 and 7.")

            # After a successful search, show the re-search/exit menu
            if choice in ['1', '2', '3', '4', '5', '6']:
                if not post_search_menu():
                    print(f"{Fore.YELLOW}Exiting CLI. Goodbye! 👋\n")
                    print(f"{Fore.YELLOW}Made by Stark ( urstark.vercel.app )")
                    break

        except EOFError:
             print(f"{Fore.RED}\nExiting CLI due to kernel interruption. 👋")
             break
        except Exception as e:
            print(f"{Fore.RED}An unexpected error occurred: {e}")
            print(f"{Fore.YELLOW}Restarting CLI...")
            continue


# STEP 6: EXECUTION
if __name__ == '__main__':
    run_cli()
