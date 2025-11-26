import { UppercasePipe } from './uppercase.pipe';

describe('UppercasePipe', () => {
  let pipe: UppercasePipe;

  beforeEach(() => {
    pipe = new UppercasePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform text to uppercase', () => {
    expect(pipe.transform('hello')).toBe('HELLO');
    expect(pipe.transform('Angular')).toBe('ANGULAR');
  });

  it('should handle empty string', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should handle null', () => {
    expect(pipe.transform(null as any)).toBe('');
  });
});
