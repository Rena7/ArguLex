import os
import json
import pandas as pd
import numpy as np
import requests
from tabulate import tabulate

# Configuration settings
API_BASE_URL = "https://www.courtlistener.com/api/rest/v4/"
API_KEY = "" 

class CourtListenerClient:
    """Client for interacting with the Court Listener API"""

    def __init__(self, api_key, base_url=API_BASE_URL):
        """Initialize with your API key"""
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": "application/json"
        }

    def search_cases(self, query, page=1, page_size=10, **kwargs):
        """Search for cases matching the query"""
        endpoint = f"{self.base_url}search/"
        params = {
            "q": query,
            "type": "o",  # 'o' for opinions
            "page": page,
            "page_size": page_size,
            **kwargs
        }

        response = requests.get(endpoint, headers=self.headers, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            return None

    def extract_relevant_case_data(self, case_data):
        """Extract relevant details from case data"""
        relevant_keys = [
            "caseName", "court", "dateFiled", "docketNumber", "status", "suitNature"
        ]
        extracted_data = {key: case_data.get(key, "N/A") for key in relevant_keys}
        extracted_data["download_url"] = case_data.get("opinions", [{}])[0].get("download_url", "N/A")
        return extracted_data

    def print_case_results(self, results):
        """Print search results in a structured format"""
        if not results or "results" not in results:
            print("No results found.")
            return

        cases = results["results"]
        print(f"\nFound {results.get('count', 0)} total results. Displaying {len(cases)} cases:")

        # Extract and format case data
        case_list = [self.extract_relevant_case_data(case) for case in cases]

        # Display results in a structured format
        headers = ["Case Name", "Court", "Date Filed", "Docket Number", "Status", "Suit Nature", "Download URL"]
        table = [[
            case["caseName"],
            case["court"],
            case["dateFiled"],
            case["docketNumber"],
            case["status"],
            case["suitNature"],
            case["download_url"]
        ] for case in case_list]
        
        print(tabulate(table, headers=headers, tablefmt="grid"))

def main():
    """Main function to run the Court Listener API search"""
    # Initialize API client
    api_key = input("Enter your Court Listener API key (or press Enter to skip): ")
    api = CourtListenerClient(api_key)

    # Step 1: Collect data
    print("Step 1: Collecting data from Court Listener API")
    query = input("\nEnter search query: ")
    filed_after = input("Filed after date (optional, YYYY-MM-DD): ")
    filed_before = input("Filed before date (optional, YYYY-MM-DD): ")
    page_size = input("Number of results (default 10): ")

    params = {}
    if filed_after:
        params["filed_after"] = filed_after
    if filed_before:
        params["filed_before"] = filed_before

    # Default page size
    try:
        page_size = int(page_size) if page_size else 10
    except ValueError:
        page_size = 10

    # Perform search
    print(f"\nSearching for '{query}'...")
    results = api.search_cases(query, page_size=page_size, **params)
    api.print_case_results(results)

if __name__ == "__main__":
    main()
