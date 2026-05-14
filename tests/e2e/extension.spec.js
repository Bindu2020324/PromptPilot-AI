import { test, expect } from '@playwright/test';
import path from 'path';
import { pathToFileURL } from 'url';

const extensionPath = path.join(process.cwd(), 'dist');
const popupPath = pathToFileURL(path.join(process.cwd(), 'dist', 'index.html')).toString();

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.chrome = {
      storage: {
        local: {
          get: (keys, callback) => callback({ pp_key: 'fake-key', pp_provider: 'gemini', pp_history: [] }),
          set: (obj, callback) => callback?.(),
        },
      },
      runtime: {
        sendMessage: (message, callback) => {
          callback({
            ok: true,
            data: {
              enhanced_prompt: 'Enhanced prompt result',
              quality_score: 91,
              originality_score: 82,
              clarity_score: 88,
            },
          });
        },
      },
    };
  });
});

test('extension loads and popup opens', async ({ page }) => {
  await page.goto(popupPath);
  await expect(page.locator('text=PromptPilot AI')).toBeVisible();
});

test('user can type a prompt and forge it', async ({ page }) => {
  await page.goto(popupPath);
  await page.fill('textarea[placeholder*=Type a weak or vague prompt]', 'generate a summary');
  await page.click('button:has-text("Forge Prompt")');
  await expect(page.locator('text=Enhanced prompt result')).toBeVisible();
});

test('settings screen saves API key and history screen shows past prompts', async ({ page }) => {
  await page.goto(popupPath);
  await page.getByTitle('Settings').click();
  await page.fill('input[placeholder="AIza..."]', 'test-api-key');
  await page.click('button:has-text("Save Settings")');
  await expect(page.locator('text=✓ Saved!')).toBeVisible();

  await page.click('button:has-text("←")');
  await page.fill('textarea[placeholder*=Type a weak or vague prompt]', 'create a landing page');
  await page.click('button:has-text("Forge Prompt")');
  await page.getByTitle('History').click();
  await expect(page.locator('text=Enhanced prompt result')).toBeVisible();
});
