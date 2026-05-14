import { render, screen } from '@testing-library/react';
import { ScoreBar } from '../App';

describe('ScoreBar', () => {
  it('renders the label and percentage value', () => {
    render(<ScoreBar label="Quality" value={65} color="#fff" bg="#4f46e5" />);
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
  });

  it('clamps the progress width between 0 and 100', () => {
    const { rerender } = render(
      <ScoreBar label="Test" value={150} color="#fff" bg="#4f46e5" />
    );
    const bar = screen.getByTestId('scorebar-fill');
    expect(bar).toBeInTheDocument();
    expect(bar.getAttribute('style')).toContain('width: 100%');

    rerender(<ScoreBar label="Test" value={-10} color="#fff" bg="#4f46e5" />);
    expect(bar.getAttribute('style')).toContain('width: 0%');
  });
});
