"""
Flask web app that renders a GitHub-profile-style README (Markdown + inline
HTML) as a styled HTML page.

Run:
    pip install flask markdown
    python app.py
Then open http://127.0.0.1:5000/
"""

from pathlib import Path

import markdown
from flask import Flask

app = Flask(__name__)

README_PATH = Path(__file__).parent.parent / "README.md"

# Extensions needed because the source file mixes Markdown with raw HTML,
# tables, and fenced code blocks.
MD_EXTENSIONS = ["extra", "tables", "fenced_code", "sane_lists", "nl2br"]

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sukumar Elley - Profile</title>
<style>
    :root {{
        color-scheme: dark;
    }}
    body {{
        background-color: #0d1117;
        color: #c9d1d9;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica,
            Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
    }}
    .container {{
        max-width: 900px;
        margin: 0 auto;
        padding: 32px 24px 80px;
    }}
    h1, h2, h3 {{
        color: #f0f6fc;
        border-bottom: 1px solid #21262d;
        padding-bottom: 8px;
    }}
    h1 {{ border-bottom: none; }}
    a {{ color: #58a6ff; text-decoration: none; }}
    a:hover {{ text-decoration: underline; }}
    img {{ max-width: 100%; height: auto; }}
    hr {{ border: none; border-top: 1px solid #21262d; margin: 32px 0; }}
    table {{
        border-collapse: collapse;
        width: 100%;
        margin: 16px 0;
        display: block;
        overflow-x: auto;
    }}
    th, td {{
        border: 1px solid #30363d;
        padding: 8px 12px;
        text-align: left;
    }}
    th {{ background-color: #161b22; }}
    code, pre {{
        background-color: #161b22;
        border-radius: 6px;
    }}
    pre {{
        padding: 16px;
        overflow-x: auto;
    }}
    code {{ padding: 2px 4px; }}
    blockquote {{
        border-left: 4px solid #30363d;
        margin: 0;
        padding: 0 16px;
        color: #8b949e;
    }}
</style>
</head>
<body>
<div class="container">
{content}
</div>
</body>
</html>
"""


def render_readme_html() -> str:
    """Read the README markdown file and convert it to an HTML fragment."""
    md_text = README_PATH.read_text(encoding="utf-8")
    html_fragment = markdown.markdown(md_text, extensions=MD_EXTENSIONS)
    return html_fragment


@app.route("/")
def index():
    content_html = render_readme_html()
    return PAGE_TEMPLATE.format(content=content_html)


if __name__ == "__main__":
    app.run(debug=True)
