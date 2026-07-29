import re, os, sys

with open(sys.argv[1]) as f:
    content = f.read()

# Extract all `filepath:line` references from the report
pattern = re.compile(r'`([^`]+?\.(?:ts|tsx)):(\d+(?:-\d+)?)`')
matches = pattern.findall(content)

repo = '/Users/bradshaw/Repos/Drops_OS'
ok = 0
fail = 0
for filepath, line_range in matches:
    full = os.path.join(repo, filepath)
    if not os.path.exists(full):
        print(f'MISSING: {filepath}')
        fail += 1
        continue
    with open(full) as f:
        total = sum(1 for _ in f)
    if '-' in line_range:
        start, end = map(int, line_range.split('-'))
        if start <= total and end <= total:
            print(f'OK: {filepath}:{line_range} (file has {total} lines)')
            ok += 1
        else:
            print(f'OUT OF RANGE: {filepath}:{line_range} (file has {total} lines)')
            fail += 1
    else:
        line_num = int(line_range)
        if line_num <= total:
            ok += 1
        else:
            print(f'OUT OF RANGE: {filepath}:{line_num} (file has {total} lines)')
            fail += 1

print(f'\n--- Results: {ok} valid, {fail} invalid ---')
