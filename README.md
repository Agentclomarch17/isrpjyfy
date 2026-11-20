# New Hoplite organization

A Chrome / Edge extension for the **existing-account** organization menu. It uses temporary access to the active tab only when invoked; it stores no credentials or account data.

1. Open `chrome://extensions` (or `edge://extensions`) and enable **Developer mode**.
2. Choose **Load unpacked** and select the `extension` directory containing `manifest.json`.
3. Sign in at https://app.hoplite.sh and open the extension on that tab.
4. Choose **Open new organization form**. The extension follows the account menu → **current organization name** → **New organization** (the organization row has a logo or initials, unlike the project folder). Enter the organization name and submit it on Hoplite.
5. When Hoplite shows **Choose your plan**, reopen the extension and choose **Choose Free on the plan screen**. It only clicks an available **Continue with Free** control; if Free is unavailable it does not select another plan.
