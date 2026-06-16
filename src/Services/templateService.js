const STORAGE_KEY = "promptpilot_templates";

export async function getTemplates() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

export async function saveTemplate(template) {
  const templates = await getTemplates();

  templates.push({
    id: Date.now().toString(),
    ...template,
  });

  await chrome.storage.local.set({
    [STORAGE_KEY]: templates,
  });
}