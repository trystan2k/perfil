import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Player } from '@/types/models';
import { RemovePointsDialog } from '../RemovePointsDialog';

const createPlayer = (id: string, name: string, score = 10): Player => ({
  id,
  name,
  score,
});

describe('RemovePointsDialog', () => {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and description with player name', () => {
    const player = createPlayer('1', 'Alice', 12);
    render(
      <RemovePointsDialog
        open={true}
        onOpenChange={onOpenChange}
        player={player}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole('heading', { name: /Remove Points/i })).toBeInTheDocument();
    expect(screen.getByText(/Remove points from Alice/i)).toBeInTheDocument();
  });

  it('validates empty amount', async () => {
    const user = userEvent.setup();
    const player = createPlayer('1', 'Alice', 5);
    render(
      <RemovePointsDialog
        open={true}
        onOpenChange={onOpenChange}
        player={player}
        onConfirm={onConfirm}
      />
    );

    const input = screen.getByLabelText('Points to Remove');
    // Focus the input and press Enter to trigger validation (confirm button is disabled when empty)
    await user.click(input);
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Please enter an amount.')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('rejects non-numeric amounts', async () => {
    const user = userEvent.setup();
    const player = createPlayer('1', 'Bob', 8);
    render(
      <RemovePointsDialog
        open={true}
        onOpenChange={onOpenChange}
        player={player}
        onConfirm={onConfirm}
      />
    );

    const input = screen.getByLabelText('Points to Remove');
    // number inputs prevent non-numeric typing in the browser; userEvent will be ignored for letters
    await user.type(input, 'abc');

    // input should remain empty and confirm button should be disabled
    expect((input as HTMLInputElement).value).toBe('');

    const dialog = screen.getByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: /Remove Points/i });
    expect(confirm).toBeDisabled();

    await user.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('rejects negative amounts', async () => {
    const user = userEvent.setup();
    const player = createPlayer('1', 'Bob', 8);
    render(
      <RemovePointsDialog
        open={true}
        onOpenChange={onOpenChange}
        player={player}
        onConfirm={onConfirm}
      />
    );

    const input = screen.getByLabelText('Points to Remove');
    await user.type(input, '-5');

    const dialog = screen.getByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: /Remove Points/i });
    await user.click(confirm);

    expect(await screen.findByText('Amount must be a non-negative integer.')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('rejects zero amount', async () => {
    const user = userEvent.setup();
    const player = createPlayer('1', 'Carol', 8);
    render(
      <RemovePointsDialog
        open={true}
        onOpenChange={onOpenChange}
        player={player}
        onConfirm={onConfirm}
      />
    );

    const input = screen.getByLabelText('Points to Remove');
    await user.type(input, '0');

    const dialog = screen.getByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: /Remove Points/i });
    await user.click(confirm);

    expect(await screen.findByText('Amount must be greater than zero.')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('rejects amount greater than player score', async () => {
    const user = userEvent.setup();
    const player = createPlayer('1', 'Dave', 3);
    render(
      <RemovePointsDialog
        open={true}
        onOpenChange={onOpenChange}
        player={player}
        onConfirm={onConfirm}
      />
    );

    const input = screen.getByLabelText('Points to Remove');
    await user.type(input, '5');

    const dialog = screen.getByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: /Remove Points/i });
    await user.click(confirm);

    expect(
      await screen.findByText(/only has 3 points. Cannot remove more than their current score./i)
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('enables confirm for valid amount and calls onConfirm', async () => {
    const user = userEvent.setup();
    const player = createPlayer('1', 'Eve', 10);
    render(
      <RemovePointsDialog
        open={true}
        onOpenChange={onOpenChange}
        player={player}
        onConfirm={onConfirm}
      />
    );

    const input = screen.getByLabelText('Points to Remove');
    await user.type(input, '4');

    const dialog = screen.getByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: /Remove Points/i });
    await user.click(confirm);

    expect(onConfirm).toHaveBeenCalledWith(4);
  });

  it('pressing Enter triggers confirmation', async () => {
    const user = userEvent.setup();
    const player = createPlayer('1', 'Frank', 6);
    render(
      <RemovePointsDialog
        open={true}
        onOpenChange={onOpenChange}
        player={player}
        onConfirm={onConfirm}
      />
    );

    const input = screen.getByLabelText('Points to Remove');
    await user.type(input, '2');
    await user.keyboard('{Enter}');

    expect(onConfirm).toHaveBeenCalledWith(2);
  });

  it('cancel button closes dialog without calling onConfirm', async () => {
    const user = userEvent.setup();
    const player = createPlayer('1', 'Grace', 6);
    render(
      <RemovePointsDialog
        open={true}
        onOpenChange={onOpenChange}
        player={player}
        onConfirm={onConfirm}
      />
    );

    const cancel = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancel);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('resets state when closed and reopened', async () => {
    const user = userEvent.setup();
    const player = createPlayer('1', 'Hank', 12);
    const { rerender } = render(
      <RemovePointsDialog
        open={true}
        onOpenChange={onOpenChange}
        player={player}
        onConfirm={onConfirm}
      />
    );

    const input = screen.getByLabelText('Points to Remove');
    await user.type(input, '3');

    // Close dialog
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    // Reopen dialog
    rerender(
      <RemovePointsDialog
        open={true}
        onOpenChange={onOpenChange}
        player={player}
        onConfirm={onConfirm}
      />
    );

    // Input should be reset
    expect((screen.getByLabelText('Points to Remove') as HTMLInputElement).value).toBe('');
  });
});
