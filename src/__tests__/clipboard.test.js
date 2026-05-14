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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('writes text to the clipboard when clipboard API is available', async () => {
    await expect(handleCopy('hello world')).resolves.toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello world');
  });

  it('falls back when clipboard.writeText throws', async () => {
    navigator.clipboard.writeText.mockRejectedValue(new Error('nope'));
    document.execCommand = jest.fn().mockReturnValue(true);
    const appendChild = jest.spyOn(document.body, 'appendChild');
    const removeChild = jest.spyOn(document.body, 'removeChild');

    await expect(handleCopy('fallback')).resolves.toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(appendChild).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();
  });

  it('returns false when no text is provided', async () => {
    await expect(handleCopy('')).resolves.toBe(false);
  });
});
