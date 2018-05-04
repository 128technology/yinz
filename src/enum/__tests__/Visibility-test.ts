import { expect } from 'chai';

import Visibility, { isVisible } from '../Visibility';

describe('Visibility', () => {
  it('should determine visibility for advanced fields', () => {
    expect(isVisible(Visibility.advanced)).to.equal(true);
  });

  it('should determine visibility for visible fields', () => {
    expect(isVisible(Visibility.visible)).to.equal(true);
  });

  it('should determine visibility for hidden fields', () => {
    expect(isVisible(Visibility.hidden)).to.equal(false);
  });
});
