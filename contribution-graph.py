import json
import os
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path


# ============================================================
# CONFIGURATION
# ============================================================

USERNAME = "Sukumar-Elley"
DAYS = 90

GRAPHQL_URL = "https://api.github.com/graphql"

OUTPUT_DIR = Path("docs")
OUTPUT_FILE = OUTPUT_DIR / "contributions.json"

TOKEN = os.environ.get("GITHUB_TOKEN")


# ============================================================
# VALIDATE TOKEN
# ============================================================

if not TOKEN:
    raise RuntimeError(
        "GITHUB_TOKEN environment variable is missing."
    )


# ============================================================
# GRAPHQL QUERY
# ============================================================

query = """
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions

        weeks {
          contributionDays {
            date
            contributionCount
            color
          }
        }
      }
    }
  }
}
"""


# ============================================================
# DATE RANGE
# ============================================================

today = datetime.now(timezone.utc).date()

start_date = today - timedelta(days=DAYS - 1)

from_datetime = f"{start_date.isoformat()}T00:00:00Z"
to_datetime = f"{today.isoformat()}T23:59:59Z"


# ============================================================
# REQUEST PAYLOAD
# ============================================================

payload = json.dumps(
    {
        "query": query,
        "variables": {
            "login": USERNAME,
            "from": from_datetime,
            "to": to_datetime,
        },
    }
).encode("utf-8")


# ============================================================
# GITHUB GRAPHQL REQUEST
# ============================================================

request = urllib.request.Request(
    GRAPHQL_URL,
    data=payload,
    headers={
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
        "User-Agent": USERNAME,
    },
    method="POST",
)


with urllib.request.urlopen(request) as response:
    result = json.loads(
        response.read().decode("utf-8")
    )


# ============================================================
# ERROR HANDLING
# ============================================================

if "errors" in result:
    raise RuntimeError(
        "GitHub GraphQL API error:\n"
        + json.dumps(
            result["errors"],
            indent=2
        )
    )


user = result.get("data", {}).get("user")

if not user:
    raise RuntimeError(
        f"GitHub user '{USERNAME}' was not found."
    )


# ============================================================
# EXTRACT CONTRIBUTION CALENDAR
# ============================================================

calendar = (
    user["contributionsCollection"]
    ["contributionCalendar"]
)


# ============================================================
# FLATTEN CONTRIBUTION DAYS
# ============================================================

days = []

for week in calendar["weeks"]:

    for day in week["contributionDays"]:

        date = datetime.strptime(
            day["date"],
            "%Y-%m-%d"
        ).date()

        if start_date <= date <= today:

            days.append(
                {
                    "date": date.isoformat(),
                    "count": day["contributionCount"],
                    "color": day["color"],
                }
            )


# ============================================================
# CREATE DATE MAP
# ============================================================

day_map = {
    item["date"]: item
    for item in days
}


# ============================================================
# ENSURE EXACTLY 90 DAYS
# ============================================================

complete_days = []

for i in range(DAYS):

    current = start_date + timedelta(days=i)

    date_string = current.isoformat()

    complete_days.append(
        day_map.get(
            date_string,
            {
                "date": date_string,
                "count": 0,
                "color": "#161B22",
            },
        )
    )


# ============================================================
# CALCULATE TOTAL
# ============================================================

total_contributions = sum(
    item["count"]
    for item in complete_days
)


# ============================================================
# CREATE OUTPUT
# ============================================================

output = {
    "username": USERNAME,
    "generatedAt": datetime.now(
        timezone.utc
    ).isoformat(),

    "days": DAYS,

    "startDate": start_date.isoformat(),

    "endDate": today.isoformat(),

    "totalContributions": total_contributions,

    "contributions": complete_days,
}


# ============================================================
# WRITE JSON
# ============================================================

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


OUTPUT_FILE.write_text(
    json.dumps(
        output,
        indent=2
    ),
    encoding="utf-8"
)


print(
    f"Generated {OUTPUT_FILE}"
)

print(
    f"Date range: "
    f"{start_date} → {today}"
)

print(
    f"Days: {len(complete_days)}"
)

print(
    f"Total contributions: "
    f"{total_contributions}"
)
