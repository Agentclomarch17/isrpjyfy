# New Hoplite organization

A Chrome / Edge extension for the **existing-account** organization menu. It uses temporary access to the active tab only when invoked; it stores no credentials or account data.

1. Open `chrome://extensions` (or `edge://extensions`) and enable **Developer mode**.
2. Choose **Load unpacked** and select the `extension` directory containing `manifest.json`.
3. Sign in at https://app.hoplite.sh and open the extension on that tab.
4. Choose **Open new organization form**. The extension follows the account menu → **current organization name** → **New organization** (the organization row has a logo or initials, unlike the project folder). An empty Name field gets a random suggestion such as `workspace-1352534`. Review or edit it on Hoplite.
5. With the named form open, choose **Create and continue for free** in the extension. This confirms one submission. The extension watches the same tab for up to 60 seconds, including across Hoplite page loads, and clicks an enabled **Continue for free** or **Continue with Free** on the plan screen. Keep the tab on this setup until it finishes.
6. If setup takes longer, use **Choose Free on the plan screen** once it appears. This never resubmits the organization form. Complete any verification on Hoplite.
