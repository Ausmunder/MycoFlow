#!/usr/bin/env python3
import urllib.request
import json

API_URL = "http://192.168.1.251:8000"

print("Fetching batches...")
response = urllib.request.urlopen(f"{API_URL}/api/batches")
batches = json.loads(response.read())
batch_ids = [b['id'] for b in batches]

print(f"Found {len(batch_ids)} batches")

if len(batch_ids) > 0:
    print(f"Deleting {len(batch_ids)} batches...")
    data = json.dumps(batch_ids).encode('utf-8')
    req = urllib.request.Request(
        f"{API_URL}/api/batches/bulk-delete",
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    response = urllib.request.urlopen(req)
    result = json.loads(response.read())
    print(f"✅ Deleted {result['deleted']} batches")
else:
    print("No batches to delete")

print("\nVerifying...")
response = urllib.request.urlopen(f"{API_URL}/api/batches")
remaining = json.loads(response.read())
print(f"Remaining batches: {len(remaining)}")
