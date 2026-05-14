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
    const button = screen.getByRole('button', { name: 'Active' });
    expect(button.style.background).toBe('rgba(124,58,237,0.22)');
    expect(button.style.borderColor).toBe('rgba(124,58,237,0.6)');

    rerender(
      <Pill active={false} onClick={() => {}} title="Inactive Pill">
        Inactive
      </Pill>
    );
    expect(button.style.background).toBe('rgba(255,255,255,0.04)');
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
