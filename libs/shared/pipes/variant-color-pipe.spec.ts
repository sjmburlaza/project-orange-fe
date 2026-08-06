import { VariantColorPipe } from './variant-color-pipe';

describe('VariantColorPipe', () => {
  const optionGroups = [
    {
      code: 'color',
      label: 'Color',
      options: [
        { code: 'midnight', label: 'Midnight', hex: '#1f2937' },
        { code: 'starlight', label: 'Starlight', hex: '#f5e6cc' },
      ],
    },
    {
      code: 'finish',
      label: 'Finish',
      options: [
        { code: 'matte', label: 'Matte', hex: '#111827' },
        { code: 'gloss', label: 'Gloss', hex: '#f9fafb' },
      ],
    },
  ];

  it('maps the selected color option code to its hex value', () => {
    const pipe = new VariantColorPipe();

    expect(pipe.transform({ color: 'starlight' }, optionGroups)).toBe(
      '#f5e6cc',
    );
  });

  it('supports a custom option group code', () => {
    const pipe = new VariantColorPipe();

    expect(pipe.transform({ finish: 'matte' }, optionGroups, 'finish')).toBe(
      '#111827',
    );
  });

  it('returns null when the selection or option group is missing', () => {
    const pipe = new VariantColorPipe();

    expect(pipe.transform({}, optionGroups)).toBeNull();
    expect(pipe.transform({ color: 'silver' }, optionGroups)).toBeNull();
    expect(pipe.transform({ color: 'starlight' }, null)).toBeNull();
  });
});
