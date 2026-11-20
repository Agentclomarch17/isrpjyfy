# New Hoplite organization

A Chrome / Edge extension for the **existing-account** organization menu. It uses temporary access to the active tab only when invoked; it stores no credentials or account data.

1. Open `chrome://extensions` (or `edge://extensions`) and enable **Developer mode**.
2. Choose **Load unpacked** and select the `extension` directory containing `manifest.json`.
3. Sign in at https://app.hoplite.sh and open the extension on that tab.
4. Click **Create organization on Free** once. The extension opens the organization form, fills an empty name (for example, `workspace-1352534`), submits it once, and waits up to 60 seconds to select Free. A name already entered in the open form is preserved.
5. Keep the Hoplite tab on setup until it finishes. If the Free option never becomes available or Hoplite requests verification, finish on Hoplite. The extension never selects another plan or retries the submission.
