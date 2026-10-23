import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWhatsAppTemplatePayload, isPermanentWhatsAppError } from './notificationService';

test('test template payload uses the configured hello_world template', () => {
  const payload = buildWhatsAppTemplatePayload({
    recipient: '+91 8438018408',
    templateName: 'hello_world',
    templateLanguage: 'en_US',
    templateParams: [],
    isTest: true,
  });

  assert.deepEqual(payload, {
    messaging_product: 'whatsapp',
    to: '918438018408',
    type: 'template',
    template: {
      name: 'hello_world',
      language: { code: 'en_US' },
    },
  });
});

test('permanent Meta template errors are classified correctly', () => {
  assert.equal(isPermanentWhatsAppError('Meta API error (132001): Template name does not exist in the translation'), true);
  assert.equal(isPermanentWhatsAppError('Meta API error (132000): Invalid parameter'), true);
  assert.equal(isPermanentWhatsAppError('Meta API error (131051): Recipient number not in allowed list'), true);
  assert.equal(isPermanentWhatsAppError('Temporary network error'), false);
});
