import { Page } from '@playwright/test';

export type FormFieldConfig = 
  | { type: 'input'; testId: string; value: string }
  | { type: 'select'; testId: string; value: string };

async function handleSelect(page: Page, testId: string, value: string) {
  const trigger = page.getByTestId(testId);

  await trigger.click();

  // Wait for dropdown container (Radix portal)
  const option = page.getByText(value, { exact: true });

  await option.waitFor({ state: 'visible', timeout: 5000 });
  await option.click();
}

export async function fillForm(page: Page, fields: FormFieldConfig[]) {
  for (const field of fields) {
    if (field.type === 'input') {
      await page.fill(`[data-testid="${field.testId}"]`, field.value);
    } else if (field.type === 'select') {
      await handleSelect(page, field.testId, field.value);
    }
  }
}
