"""Create one randomly named Hoplite organization and continue with the Free plan."""

import argparse
import re
from secrets import token_hex
from urllib.parse import urlsplit

from playwright.sync_api import TimeoutError as PlaywrightTimeout
from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--free-plan", action="store_true",
                        help="Continue with Free (now the default).")
    parser.parse_args()
    name = f"Cedar-{token_hex(4)}"
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto("https://hoplite.sh", wait_until="domcontentloaded")
        input("Sign in and open the organization switcher so 'New organization' "
              "is visible (or open the creation form). Then press Enter here. ")

        tabs = [p for p in page.context.pages
                if (urlsplit(p.url).hostname or "").split(".")[-2:] == ["hoplite", "sh"]
                and urlsplit(p.url).scheme == "https"]
        page = next((p for p in reversed(tabs)
                     if p.get_by_placeholder("My organization", exact=True).is_visible()
                     or p.get_by_text("New organization", exact=True).is_visible()), None)
        if page is None:
            raise SystemExit("No Hoplite creation form or open organization menu found. Nothing submitted.")

        field = page.get_by_placeholder("My organization", exact=True)
        if not field.is_visible():
            page.get_by_text("New organization", exact=True).click()
        field.fill(name)
        print(f"Submitting one organization: {name}", flush=True)
        page.get_by_role("button", name="Create organization", exact=True).click()
        try:
            page.get_by_text(re.compile(r"switched to\s+" + re.escape(name), re.I)).first.wait_for(
                state="visible", timeout=15000
            )
            print(f"Created and switched to {name}.")
        except PlaywrightTimeout:
            print(f"Could not confirm creation. Check the organization switcher for {name} before retrying.")
        else:
            try:
                page.get_by_role("button", name="Continue with Free", exact=True).click(timeout=30000)
                print("Clicked Continue with Free. Complete any card verification in the browser.")
            except PlaywrightTimeout:
                print("Could not confirm the Free button click. Check the page before continuing manually.")
        input("Press Enter to close the browser. ")


if __name__ == "__main__":
    main()
