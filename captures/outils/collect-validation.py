import subprocess, pathlib, datetime, time, json, sys, os
sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parents[2]
name = sys.argv[1]
commands = {'typecheck':['run','typecheck'], 'eslint':['run','lint'], 'build':['run','build'], 'vitest':['test','--','--reporter=default','--reporter=json','--outputFile=captures/tests/vitest-results.json'], 'playwright':['run','test:e2e','--','--workers=3','--reporter=list,json']}
args = commands[name]
env = os.environ.copy()
env['NO_COLOR']='1'
if name == 'playwright': env['PLAYWRIGHT_JSON_OUTPUT_NAME']='captures/tests/playwright-results.json'
start = datetime.datetime.now(datetime.timezone.utc).isoformat()
t = time.monotonic()
r = subprocess.run(['cmd','/c','npm.cmd',*args],cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env)
(ROOT/'captures/tests'/f'{name}.txt').write_bytes(r.stdout)
record={'command':'npm.cmd '+' '.join(args),'startedAt':start,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'durationSeconds':round(time.monotonic()-t,3),'exitCode':r.returncode,'log':f'{name}.txt'}
(ROOT/'captures/tests'/f'{name}-execution.json').write_text(json.dumps(record,indent=2),encoding='utf-8')
print(json.dumps(record)); print(r.stdout.decode('utf-8',errors='replace')[-4000:])
sys.exit(r.returncode)

