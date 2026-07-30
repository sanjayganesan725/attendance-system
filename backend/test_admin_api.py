import urllib.request
import json

req = urllib.request.Request(
    'http://localhost:8000/api/v1/auth/login',
    data=json.dumps({'email':'admin@attendance.com','password':'123456'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res = urllib.request.urlopen(req)
data = json.loads(res.read().decode('utf-8'))
token = data['access_token']

req2 = urllib.request.Request(
    'http://localhost:8000/api/v1/faculty/dashboard/stats',
    headers={'Authorization': f'Bearer {token}'}
)
res2 = urllib.request.urlopen(req2)
data2 = json.loads(res2.read().decode('utf-8'))
print("STATS ASSIGNMENTS COUNT:", len(data2.get('assignments', [])))
print("ASSIGNMENTS SAMPLE:", data2.get('assignments', [])[:2])

req3 = urllib.request.Request(
    'http://localhost:8000/api/v1/admin/classes',
    headers={'Authorization': f'Bearer {token}'}
)
res3 = urllib.request.urlopen(req3)
data3 = json.loads(res3.read().decode('utf-8'))
print("CLASSES COUNT:", len(data3))
print("CLASSES NAMES:", [c['name'] for c in data3])
