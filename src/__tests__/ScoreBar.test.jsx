import { render, screen } from '@testing-library/react';
import { ScoreBar } from '../App';

describe('ScoreBar', () => {
  it('renders the label and percentage value', () => {
    render(<ScoreBar label="Quality" value={65} color="#fff" bg="#4f46e5" />);
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
  });

  it('clamps the progress width between 0 and 100', () => {
    const { container, rerender } = render(
      <ScoreBar label="Test" value={150} color="#fff" bg="#4f46e5" />
    );
    expect(container.querySelector('div > div > div')).toHaveStyle('width: 100%');

    rerender(<ScoreBar label="Test" value={-10} color="#fff" bg="#4f46e5" />);
    expect(container.querySelector('div > div > div')).toHaveStyle('width: 0%');
  });
});
