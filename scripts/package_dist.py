import os
import zipfile

root = r'd:\100. cá nhân\mobile game'
dist = os.path.join(root, 'logic-gate-plumber', 'dist')
assets_dir = os.path.join(dist, 'assets')
js_files = [f for f in os.listdir(assets_dir) if f.endswith('.js')]
if not js_files:
    raise Exception("No JS bundle found in dist/assets")

js_file = js_files[0]
js_path = os.path.join(assets_dir, js_file)

with open(os.path.join(dist, 'index.html'), 'r', encoding='utf-8') as f:
    html = f.read()

with open(js_path, 'r', encoding='utf-8') as f:
    js_code = f.read()

# Inline JS
script_tag = f'<script type="module" crossorigin src="./assets/{js_file}"></script>'
inline_tag = f'<script type="module">\n{js_code}\n</script>'
standalone_html = html.replace(script_tag, inline_tag)

# Write to logic-gate-plumber/CHOI_THU_TRUC_TIEP.html
p1 = os.path.join(root, 'logic-gate-plumber', 'CHOI_THU_TRUC_TIEP.html')
with open(p1, 'w', encoding='utf-8') as f:
    f.write(standalone_html)

# Write to root/CHOI_THU_TRUC_TIEP.html
p2 = os.path.join(root, 'CHOI_THU_TRUC_TIEP.html')
with open(p2, 'w', encoding='utf-8') as f:
    f.write(standalone_html)

print(f"Generated standalone html: {p1} ({os.path.getsize(p1):,} bytes)")

# Create crazygames-build.zip
zip_path = os.path.join(root, 'logic-gate-plumber', 'crazygames-build.zip')
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for foldername, subfolders, filenames in os.walk(dist):
        for filename in filenames:
            filepath = os.path.join(foldername, filename)
            arcname = os.path.relpath(filepath, dist)
            z.write(filepath, arcname)

print(f"Created zip: {zip_path} ({os.path.getsize(zip_path):,} bytes)")
