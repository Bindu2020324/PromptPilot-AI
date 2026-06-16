import { scorePrompt, getGrade, DIMENSIONS, GRADES } from './PromptScorer';

describe('PromptScorer Engine tests', () => {
  test('scorePrompt returns structured scores for valid text', () => {
    const prompt = 'Implement a fast React dropdown component with search filter, using TypeScript and tailwind. Avoid third-party libs.';
    const result = scorePrompt(prompt);

    expect(result).toHaveProperty('overall');
    expect(result).toHaveProperty('grade');
    expect(result).toHaveProperty('dimensions');
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  test('scorePrompt returns low score for vague/short input', () => {
    const result = scorePrompt('make good website');
    expect(result.overall).toBeLessThan(40);
  });

  test('getGrade maps score correctly', () => {
    expect(getGrade(95).letter).toBe('S');
    expect(getGrade(80).letter).toBe('A');
    expect(getGrade(65).letter).toBe('B');
    expect(getGrade(50).letter).toBe('C');
    expect(getGrade(35).letter).toBe('D');
    expect(getGrade(10).letter).toBe('F');
  });

  test('DIMENSIONS is exported correctly with 8 dimensions', () => {
    expect(DIMENSIONS.length).toBe(8);
  });
});
