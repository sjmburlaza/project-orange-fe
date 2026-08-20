import { IconPipe } from './icon-pipe';

describe('IconPipe', () => {
  it('create an instance', () => {
    const pipe = new IconPipe();
    expect(pipe).toBeTruthy();
  });

  it('returns the display icon for monitor products', () => {
    const pipe = new IconPipe();

    expect(pipe.transform('Monitors')).toBe('bi bi-display');
  });

  it('returns the fallback icon for missing and unknown categories', () => {
    const pipe = new IconPipe();

    expect(pipe.transform(undefined)).toBe('bi bi-box');
    expect(pipe.transform('unknown category')).toBe('bi bi-box');
  });
});
