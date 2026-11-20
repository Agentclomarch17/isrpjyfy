const button = document.getElementById('create');
const status = document.getElementById('status');

button.addEventListener('click', async () => {
  button.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || new URL(tab.url).origin !== 'https://app.hoplite.sh') {
      status.textContent = 'Open Hoplite below, sign in, then reopen the extension.';
      return;
    }
    status.textContent = 'Opening the form, creating one organization, then selecting Free…';
    status.textContent = await chrome.runtime.sendMessage({ action: 'create', tabId: tab.id });
  } catch {
    status.textContent = 'Setup was interrupted. Check Hoplite before starting again.';
  } finally {
    button.disabled = false;
  }
});
