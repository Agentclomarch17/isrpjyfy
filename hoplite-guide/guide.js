const labels = new Set(["New organization", "Create organization", "Continue with Free"]);
const selector = 'button, a, [role="button"], [role^="menuitem"]';
function highlight() {
  for (const el of document.querySelectorAll(selector)) {
    const label = (el.getAttribute("aria-label") || el.innerText || "").trim().replace(/^\+\s*/, "");
    el.toggleAttribute("data-hoplite-guide", labels.has(label));
  }
}
highlight();
new MutationObserver(highlight).observe(document.body, {
  childList: true, subtree: true, characterData: true, attributes: true,
  attributeFilter: ["aria-label", "role", "hidden"]
});
