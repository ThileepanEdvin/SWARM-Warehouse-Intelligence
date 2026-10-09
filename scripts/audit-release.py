"""Audit local avant publication : aucun contenu secret n'est affiché."""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)

PATTERNS = {
    'github_token': rb'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b',
    'aws_access_key': rb'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b',
    'google_api_key': rb'\bAIza[A-Za-z0-9_-]{35}\b',
    'private_key': rb'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----',
    'service_secret': rb'\b(?:sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}|xox[baprs]-[A-Za-z0-9-]{20,})\b',
    'credential_in_url': rb'https?://[^\s/:@]{2,}:[^\s/@]{6,}@',
}
ASSIGNMENT = re.compile(rb'''(?i)(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|passwd|secret|token)\s*[:=]\s*["']([^"'\r\n]{8,})["']''')
findings = []

def inspect(data, location):
    for name, expression in PATTERNS.items():
        if re.search(expression, data):
            findings.append({'location': location, 'kind': name})
    if b'\x00' not in data[:4096]:
        for match in ASSIGNMENT.finditer(data):
            value = match.group(1).lower()
            if not any(x in value for x in [b'example', b'placeholder', b'changeme', b'process.env', b'import.meta.env', b'your_', b'xxxx', b'${']):
                findings.append({'location': location, 'kind': 'quoted_credential_assignment'})

paths = git('ls-files', '-z', '--cached', '--others', '--exclude-standard').decode('utf-8').split('\0')
files = sorted(set(p for p in paths if p))
for name in files:
    path = ROOT / name
    if path.is_file():
        inspect(path.read_bytes(), 'worktree:' + name)

mapping = {}
for line in git('rev-list', '--objects', '--all', '--reflog').decode('utf-8').splitlines():
    parts = line.split(' ', 1)
    if len(parts) == 2:
        mapping[parts[0]] = parts[1]
objects = git('cat-file', '--batch-all-objects', '--batch-check=%(objectname) %(objecttype)').decode().splitlines()
blobs = [line.split()[0] for line in objects if line.endswith(' blob')]
reader = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
try:
    for oid in blobs:
        reader.stdin.write((oid + '\n').encode()); reader.stdin.flush()
        header = reader.stdout.readline().split()
        size = int(header[2]); data = reader.stdout.read(size); reader.stdout.read(1)
        inspect(data, 'git:' + oid[:12] + ':' + mapping.get(oid, '(historical blob)'))
finally:
    reader.stdin.close(); reader.wait()

for name in sorted(set(mapping.values())):
    item = Path(name)
    if item.name.startswith('.env') and item.name != '.env.example' or item.suffix.lower() in ['.pem', '.key', '.p12', '.pfx']:
        findings.append({'location': 'history:' + name, 'kind': 'sensitive_filename'})

suspect_paths = [name for name in files if Path(name).name.startswith('.env') and Path(name).name != '.env.example' or Path(name).suffix.lower() in ['.pem', '.key', '.p12', '.pfx']]
for name in suspect_paths:
    findings.append({'location': name, 'kind': 'sensitive_filename'})
print(json.dumps({'worktree_files': len(files), 'historical_blobs': len(blobs), 'findings': findings}, ensure_ascii=False))
raise SystemExit(1 if findings else 0)
