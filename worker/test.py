import json
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from babel.dates   import parse_date, format_date, Locale



def start(metadata_json: dict) -> dict:
    """Replicates the JavaScript‑side metadata handling in Python and
    returns a dict with the computed fields.
    """
    user_feeling = metadata_json["feelings"]

    # JS getDay(): Sunday=0 … Saturday=6
    day_index = int(metadata_json["day"])
    days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    today = days[day_index]
    tomorrow = days[(day_index + 1) % 7]

    tz_name = metadata_json["timezone"]

    loc:str     = metadata_json["locale"]
    today   = parse_date(metadata_json["date"], locale=loc.replace("-", "_"))
    tomorrow= today + timedelta(days=1)
    out     = format_date(tomorrow, format="short", locale=loc.replace("-", "_"))
    print(out)


    # Parse the m/d/YYYY date and attach tzinfo so timedelta math is unambiguous
    # dt = datetime.fromisoformat(metadata_json["date"])
    # localday = dt.astimezone(ZoneInfo(tz_name)).date()
    # tomorrow_date = "localday + timedelta(days=1)"

    # Extract only HH:MM:SS from the JS time string
    time_str = metadata_json["time"].split(" ")[0]

def main() -> None:
    """Creates a sample metadata payload (similar to the JS code) and
    prints the processed result so the script can be run directly.
    """
    now = datetime.now()

    sample_metadata = {
        "stage": "1",
        "feelings": "happy",  # or any value
        "date": "7/27/2025",
        "day": 1,
        "time": "19:10:16 GMT-0400 (Eastern Daylight Time)",
        "timezone": "America/New_York",
        "locale": "en-US"  # adjust as needed
    }

    start(sample_metadata)

if __name__ == "__main__":
    main()