import { handleCopy } from '../utils/clipboard';

describe('handleCopy', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('writes text to the clipboard when clipboard API is available', async () => {
    await expect(handleCopy('hello world')).resolves.toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello world');
  });

  it('returns false when no text is provided', async () => {
    await expect(handleCopy('')).resolves.toBe(false);
  });
});
