#!/usr/bin/env python3
"""
Test script for the new repository analysis endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_create_repository():
    """Test creating a new repository analysis"""
    url = f"{BASE_URL}/api/repository-analysis"
    data = {
        "repository_url": "https://github.com/test/repo2",
        "project_description": "Second test project for smart contract analysis",
        "environment": "testnet",
        "user_id": "@0xps",
        "reference_files": ["contract3.sol", "contract4.sol"]
    }
    
    response = requests.post(url, json=data)
    print(f"CREATE: {response.status_code}")
    if response.status_code == 201:
        result = response.json()
        print(f"✅ Created: {result['run_id']}")
        return result['run_id']
    else:
        print(f"❌ Error: {response.text}")
        return None

def test_get_repositories():
    """Test getting all repositories for a user"""
    url = f"{BASE_URL}/api/my-repositories"
    params = {"user_id": "@0xps", "limit": 10}
    
    response = requests.get(url, params=params)
    print(f"LIST: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Found {len(result['data'])} repositories")
        for repo in result['data']:
            print(f"  - {repo['repository_name']} ({repo['run_id']})")
        return result['data']
    else:
        print(f"❌ Error: {response.text}")
        return []

def test_get_repository_details(run_id):
    """Test getting details of a specific repository"""
    url = f"{BASE_URL}/api/repository-analysis/{run_id}"
    
    response = requests.get(url)
    print(f"DETAILS: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        data = result['data']
        print(f"✅ Repository: {data['repository_url']}")
        print(f"  Environment: {data['environment']}")
        print(f"  Status: {data['status']}")
        print(f"  Files: {data['reference_files']}")
        return data
    else:
        print(f"❌ Error: {response.text}")
        return None

def test_update_repository(run_id):
    """Test updating a repository"""
    url = f"{BASE_URL}/api/repository-analysis/{run_id}"
    data = {
        "project_description": "Updated project description",
        "environment": "local",
        "reference_files": ["updated_contract.sol"]
    }
    
    response = requests.put(url, json=data)
    print(f"UPDATE: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Updated: {result['data']['repository_url']}")
        return result['data']
    else:
        print(f"❌ Error: {response.text}")
        return None

def test_delete_repository(run_id):
    """Test deleting a repository"""
    url = f"{BASE_URL}/api/repository-analysis/{run_id}"
    
    response = requests.delete(url)
    print(f"DELETE: {response.status_code}")
    if response.status_code == 200:
        print(f"✅ Deleted: {run_id}")
        return True
    else:
        print(f"❌ Error: {response.text}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Repository Analysis Endpoints")
    print("=" * 50)
    
    # Test 1: Create repository
    print("\n1. Creating repository...")
    run_id = test_create_repository()
    
    if run_id:
        # Test 2: Get all repositories
        print("\n2. Listing repositories...")
        test_get_repositories()
        
        # Test 3: Get repository details
        print("\n3. Getting repository details...")
        test_get_repository_details(run_id)
        
        # Test 4: Update repository
        print("\n4. Updating repository...")
        test_update_repository(run_id)
        
        # Test 5: Delete repository
        print("\n5. Deleting repository...")
        test_delete_repository(run_id)
    
    print("\n" + "=" * 50)
    print("✅ Testing complete!") 