"""Create one randomly named Hoplite organization and continue with the Free plan."""

import argparse
import re
from pathlib import Path
from secrets import token_hex
from urllib.parse import urlsplit

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import TimeoutError as PlaywrightTimeout
from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--free-plan", action="store_true",
                        help="Continue with Free (now the default).")
    parser.add_argument("--anty-port", required=True, type=int,
                        help="Local DevTools port for your running Anty profile.")
    args = parser.parse_args()
    if not 1 <= args.anty_port <= 65535:
        parser.error("The port must be between 1 and 65535.")
    receipt = Path(__file__).with_suffix(".attempt")
    if receipt.exists():
        raise SystemExit(f"A creation attempt is already recorded in {receipt.name}. Check Hoplite first.")
    name = f"Cedar-{token_hex(4)}"
    with sync_playwright() as pw:
        try:
            browser = pw.chromium.connect_over_cdp(f"http://127.0.0.1:{args.anty_port}", timeout=5000)
        except PlaywrightError:
            raise SystemExit("Cannot connect. Use the DevTools port of an automation-enabled Anty profile.") from None
        tabs = [p for context in browser.contexts for p in context.pages
                if urlsplit(p.url).scheme == "https"
                and urlsplit(p.url).hostname in {"hoplite.sh", "app.hoplite.sh", "www.hoplite.sh"}
                and (p.get_by_placeholder("My organization", exact=True).is_visible()
                     or p.get_by_text("New organization", exact=True).is_visible())]
        if len(tabs) != 1:
            raise SystemExit("Open the New organization form in exactly one Hoplite tab in that profile.")
        page = tabs[0]

        field = page.get_by_placeholder("My organization", exact=True)
        if not field.is_visible():
            page.get_by_text("New organization", exact=True).click()
        field.fill(name)
        try:
            with receipt.open("x", encoding="utf-8") as f:
                f.write(name + "\n")
        except FileExistsError:
            raise SystemExit("Another run already recorded a creation attempt.") from None
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



if __name__ == "__main__":
    main()
