import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pill } from '../App';

describe('Pill', () => {
  it('renders active state styling when active', () => {
    const { rerender } = render(
      <Pill active onClick={() => {}} title="Active Pill">
        Active
      </Pill>
    );
    const button = screen.getByTestId('pill-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-active', 'true');

    rerender(
      <Pill active={false} onClick={() => {}} title="Inactive Pill">
        Inactive
      </Pill>
    );
    expect(button).toHaveAttribute('data-active', 'false');
  });

  it('calls onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <Pill active={false} onClick={onClick} title="Click Pill">
        Click me
      </Pill>
    );

    await user.click(screen.getByRole('button', { name: 'Click me' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
