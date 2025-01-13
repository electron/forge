import { describe, expect, it } from 'vitest';

import getNameFromAuthor from '../src/util/author-name';

describe('author-name', () => {
  describe('getNameFromAuthor', () => {
    [
      {
        author: 'First Last',
        expectedReturnValue: 'First Last',
      },
      {
        author: 'First Last <first.last@example.com>',
        expectedReturnValue: 'First Last',
      },
      {
        author: {
          name: 'First Last',
        },
        expectedReturnValue: 'First Last',
      },
      {
        author: undefined,
        expectedReturnValue: '',
      },
      {
        author: '',
        expectedReturnValue: '',
      },
    ].forEach((scenario) => {
      it(`${JSON.stringify(scenario.author)} -> "${scenario.expectedReturnValue}"`, () => {
        expect(getNameFromAuthor(scenario.author)).toEqual(scenario.expectedReturnValue);
      });
    });
  });
});
