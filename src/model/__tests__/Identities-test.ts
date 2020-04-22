import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import { Identities } from '../';

describe('Identities', () => {
  const idenText = fs.readFileSync(path.join(__dirname, './data/testIdentities.xml'), 'utf-8');
  const idenEl = xmlUtil.toElement(idenText);

  it('should parse all bases', () => {
    const identities = new Identities(idenEl);

    expect(identities.identities.size).to.equal(9);
  });

  it('should parse all extensions to a base', () => {
    const identities = new Identities(idenEl);

    expect(identities.identities.get('action-type')!.length).to.equal(18);
  });

  it('should get options for a given base', () => {
    const identities = new Identities(idenEl);

    expect(identities.getOptions('action-type')).to.deep.equal([
      'rp:set-aggregator',
      'rp:set-community',
      'rp:set-atomic-aggregate',
      'rp:set-extended-community',
      'rp:filter-on-community',
      'rp:modify-metric',
      'rp:call',
      'rp:modify-as-path',
      'rp:set-tag',
      'rp:set-bgp-weight',
      'rp:set-originator-id',
      'rp:set-source',
      'rp:set-next-hop',
      'rp:remove-community',
      'rp:continue',
      'rp:set-origin',
      'rp:set-metric-type',
      'rp:set-local-preference'
    ]);
  });

  it('should get options for a given base that was prefixed in the model', () => {
    const identities = new Identities(idenEl);

    expect(identities.getOptions('routing-protocol')).to.deep.equal(['rt:bgp']);
  });
});
