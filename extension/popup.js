async function runOnHoplite(step) {
  if (location.origin !== 'https://app.hoplite.sh') return 'Open your signed-in Hoplite tab first.';
  const visible = el => el.checkVisibility() && el.getClientRects().length && !el.matches(':disabled, [aria-disabled="true"]');
  const controls = 'button, a, [role="button"], [role="tab"], [role="menuitem"]';
  function named(label, root = document) {
    const matches = [...root.querySelectorAll(controls)].filter(el =>
      visible(el) && (el.getAttribute('aria-label') || el.innerText).trim() === label);
    return matches.length === 1 ? matches[0] : null;
  }
  async function waitFor(find) {
    for (let i = 0; i < 25; i++) {
      const el = find();
      if (el) return el;
      await new Promise(resolve => setTimeout(resolve, 80));
    }
  }
  if (step === 'free') {
    const heading = [...document.querySelectorAll('h1,h2,h3,[role="heading"]')].find(el =>
      visible(el) && el.innerText.trim() === 'Choose your plan');
    const free = heading && named('Continue with Free');
    if (!free) return 'Open the new organization’s plan screen first. No plan was changed.';
    free.click();
    return 'Selected Free. Finish any verification on Hoplite.';
  }
  function nameField() {
    const fields = [...document.querySelectorAll('dialog, [role="dialog"], [role="alertdialog"]')]
      .filter(dialog => visible(dialog) && [...dialog.querySelectorAll('h1,h2,h3,[role="heading"]')]
        .some(title => title.textContent.trim() === 'Create organization'))
      .flatMap(dialog => [...dialog.querySelectorAll('input')].filter(input =>
        input.type === 'text' && visible(input) && !input.readOnly &&
        [...input.labels].some(label => label.textContent.trim() === 'Name')));
    return fields.length === 1 ? fields[0] : null;
  }
  function suggestName(input) {
    if (input.value) return 'Your existing name was left unchanged.';
    const suffix = 1000000 + crypto.getRandomValues(new Uint32Array(1))[0] % 9000000;
    const name = `workspace-${suffix}`;
    // Notify Hoplite’s controlled field just as typing would.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, name);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return `Suggested ${name}. Review or edit it, then click Create organization.`;
  }
  const existingField = nameField();
  if (existingField) return suggestName(existingField);
  const account = document.querySelector('[aria-label="Account, organization and project"]');
  function organizationRow() {
    const menu = document.getElementById(account?.getAttribute('aria-controls'));
    const menus = menu ? [menu] : [...document.querySelectorAll('[data-slot="dropdown-menu-content"]')];
    const rows = menus.filter(visible).flatMap(root =>
      [...root.querySelectorAll('[data-slot="dropdown-menu-sub-trigger"]')].filter(el =>
        visible(el) && el.querySelector(':scope > img[alt$=" logo"], :scope > span[aria-hidden="true"]:first-child')));
    return rows.length === 1 ? rows[0] : null;
  }
  const newOrganization = () => {
    const menus = [...document.querySelectorAll('[data-slot="dropdown-menu-sub-content"]')];
    const actions = new Set(menus.filter(visible).map(menu => named('New organization', menu)).filter(Boolean));
    return actions.size === 1 ? [...actions][0] : null;
  };
  let action = newOrganization();
  if (!action) {
    if (account && visible(account) && account.getAttribute('aria-expanded') !== 'true') account.click();
    const row = await waitFor(organizationRow);
    if (row) {
      row.click();
      action = await waitFor(newOrganization);
    }
  }
  if (!action) return 'Open your account menu, click your current organization’s name, then choose New organization.';
  action.click();
  const input = await waitFor(nameField);
  return input ? suggestName(input) : 'Could not find the Name field. Enter a name on Hoplite.';
}

for (const button of document.querySelectorAll('button')) {
  button.addEventListener('click', async () => {
    const status = document.getElementById('status');
    const buttons = document.querySelectorAll('button');
    buttons.forEach(el => { el.disabled = true; });
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url || new URL(tab.url).origin !== 'https://app.hoplite.sh') {
        status.textContent = 'Open Hoplite below, sign in, then reopen the extension.';
        return;
      }
      const [response] = await chrome.scripting.executeScript({
        target: { tabId: tab.id }, func: runOnHoplite, args: [button.id]
      });
      status.textContent = response.result;
    } catch {
      status.textContent = 'The tab changed or is unavailable. Reopen the extension on Hoplite.';
    } finally {
      buttons.forEach(el => { el.disabled = false; });
    }
  });
}
