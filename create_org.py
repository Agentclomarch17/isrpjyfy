"""Create one randomly named Hoplite organization and continue with the Free plan."""

import argparse
from http.client import HTTPConnection, HTTPException
import json
import re
from pathlib import Path
from secrets import token_hex
from urllib.parse import urlsplit

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import TimeoutError as PlaywrightTimeout
from playwright.sync_api import sync_playwright


def automation_port(profile_id):
    api = HTTPConnection("127.0.0.1", 3001, timeout=30)
    try:
        api.request("GET", f"/v1.0/browser_profiles/{profile_id}/start?automation=1")
        response = api.getresponse()
        if response.status == 402:
            raise SystemExit("Anty does not allow automation on this plan. No DevTools port is available.")
        if response.status == 409:
            raise SystemExit("Profile already running. Use its existing automation port if available, "
                             "or close it in Anty and retry on an automation-enabled plan.")
        if response.status != 200:
            raise SystemExit(f"Anty's local API returned HTTP {response.status}; no port obtained.")
        result = json.load(response)
        automation = result.get("automation") if isinstance(result, dict) else None
        port = automation.get("port") if isinstance(automation, dict) else None
        if not str(port).isascii() or not str(port).isdecimal() or not 1 <= int(port) <= 65535:
            raise SystemExit("Anty did not return a valid automation port.")
        return int(port)
    except (OSError, HTTPException, ValueError) as exc:
        raise SystemExit("Could not read the automation port from Anty's local API.") from exc
    finally:
        api.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--free-plan", action="store_true",
                        help="Continue with Free (now the default).")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--anty-profile", type=int, help="Ask Anty to start this profile and report its automation port.")
    source.add_argument("--anty-port", type=int,
                        help="Local DevTools port for your running Anty profile.")
    args = parser.parse_args()
    if args.anty_profile is not None and args.anty_profile < 1:
        parser.error("The profile ID must be positive.")
    if args.anty_port is not None and not 1 <= args.anty_port <= 65535:
        parser.error("The port must be between 1 and 65535.")
    receipt = Path(__file__).with_suffix(".attempt")
    if receipt.exists():
        raise SystemExit(f"A creation attempt is already recorded in {receipt.name}. Check Hoplite first.")
    port = args.anty_port or automation_port(args.anty_profile)
    name = f"Cedar-{token_hex(4)}"
    with sync_playwright() as pw:
        try:
            browser = pw.chromium.connect_over_cdp(f"http://127.0.0.1:{port}", timeout=5000)
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
