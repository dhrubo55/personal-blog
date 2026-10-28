import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, source } from './helpers/site-fixture.mjs';
import { auditSite } from '../scripts/audit-site.mjs';

test('built integrations are independently explicit opt-ins without duplicate initializers', async () => {
  const site = await fixture({
    'layouts/index.html': '{{ partial "extend_head.html" . }}{{ partial "twitter-analytics.html" . }}',
    'layouts/_partials/extend_head.html': await source('layouts/_partials/extend_head.html'),
    'layouts/_partials/twitter-analytics.html': await source('layouts/partials/twitter-analytics.html')
  }, { params: { GoogleAnalyticsID: 'G-FIXTURE', AdSenseClient: 'ca-pub-fixture', TwitterPixelID: 'fixture' } });
  try {
    const absent = await site.build();
    assert.doesNotMatch(absent, /googletagmanager|googlesyndication|ads-twitter|twq\('init'|gtag\('config'/);
    for (let bits = 0; bits < 8; bits++) {
      const tracking = { googleAnalytics: Boolean(bits & 1), adsense: Boolean(bits & 2), twitter: Boolean(bits & 4) };
      const html = await site.build({ params: { tracking } });
      for (const [setting, expression] of [['googleAnalytics', /googletagmanager\.com\/gtag/g], ['adsense', /googlesyndication\.com\/pagead/g], ['twitter', /ads-twitter\.com\/uwt/g]]) {
        assert.equal([...html.matchAll(expression)].length, Number(tracking[setting]), JSON.stringify(tracking));
      }
      assert.equal([...html.matchAll(/gtag\('config'/g)].length, Number(tracking.googleAnalytics));
      assert.equal([...html.matchAll(/twq\('init'/g)].length, Number(tracking.twitter));
      const audit = await auditSite(site.directory + '/public', { tracking: site.config().params.tracking });
      assert.equal(audit.errors.filter(error => error.kind === 'default-tracking').length, 0, JSON.stringify(tracking));
    }
  } finally { await site.close(); }
});
