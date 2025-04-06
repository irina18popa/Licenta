import requests
import json

url = "http://127.0.0.1:8123/api/states"
headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkMzUzM2VlZDVlODA0NjZlOGMyYzBkYzVmNzgyNDFkMCIsImlhdCI6MTczOTQ4NzAyNCwiZXhwIjoyMDU0ODQ3MDI0fQ.n3RMhVDjDoX2JH9KlMjZOr8MvVhVYx36dmMvfioeY9Y",
}
response = requests.request("GET", url, headers=headers)

#print(response.text)
if response.status_code == 200:
    data = response.json()
    # Pretty-print JSON with 2 spaces indentation
    pretty_json = json.dumps(data, indent=2)
    print(pretty_json)
else:
    print("Error:", response.status_code)