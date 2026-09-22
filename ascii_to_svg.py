from pathlib import Path
import base64, re

svg_path = Path("/mnt/data/profile-photo-terminal-updated.svg")
img_path = Path("/mnt/data/53a5da4e-a582-41fc-a5a1-af113f110ee3.png")

svg = svg_path.read_text(encoding="utf-8")
img_b64 = base64.b64encode(img_path.read_bytes()).decode("ascii")
data_uri = f"data:image/png;base64,{img_b64}"

# Replace only the current portrait image href, preserving the terminal layout,
# reveal mask, scan animation, system-info panel, gradients, and borders.
svg = re.sub(
    r'(?s)(<image\s+x="28"\s+y="48"\s+width="460"\s+height="440"\s+preserveAspectRatio="xMidYMid slice"\s+href=")data:image/png;base64,[^"]*(".*?/>)',
    lambda m: m.group(1) + data_uri + m.group(2),
    svg,
    count=1
)

out_path = Path("/main/assets/profile-photo.svg")
out_path.write_text(svg, encoding="utf-8")

print(f"Created: {out_path}")
print(f"New portrait embedded: {len(img_b64):,} Base64 characters")
print("Only the portrait image was changed; the rest of the SVG was preserved.")
