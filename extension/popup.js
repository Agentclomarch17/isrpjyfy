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
  const next = () => named('New organization') || named('Organizations');
  let action = next();
  if (!action) {
    const account = document.querySelector('[aria-label="Account, organization and project"]');
    if (account && visible(account) && account.getAttribute('aria-expanded') !== 'true') account.click();
    action = await waitFor(next);
  }
  if (action && action === named('Organizations')) {
    action.click();
    action = await waitFor(() => named('New organization'));
  }
  if (!action) return 'Click your username → Organizations → New organization on Hoplite.';
  action.click();
  return 'Finish the organization form on Hoplite. At the plan screen, reopen this extension to choose Free.';
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
