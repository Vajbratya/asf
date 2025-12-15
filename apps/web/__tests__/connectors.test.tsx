/**
 * Connectors Page Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ConnectorsPage from '@/app/(dashboard)/dashboard/connectors/page';

// Mock the API and toast
jest.mock('@/lib/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiDelete: jest.fn(),
}));

jest.mock('@/lib/toast', () => ({
  notify: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const { apiGet, apiPost, apiDelete } = require('@/lib/api');

describe('Connectors Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    apiGet.mockImplementation(() => new Promise(() => {}));

    render(<ConnectorsPage />);
    expect(screen.getByText(/loading connectors/i)).toBeInTheDocument();
  });

  it('should display connectors after successful load', async () => {
    apiGet.mockResolvedValue({
      connectors: [
        {
          id: 'conn-1',
          name: 'Test Connector',
          type: 'HL7',
          host: 'localhost',
          port: 2575,
          status: 'active',
        },
      ],
    });

    render(<ConnectorsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Connector')).toBeInTheDocument();
      expect(screen.getByText('HL7')).toBeInTheDocument();
      expect(screen.getByText('localhost')).toBeInTheDocument();
    });
  });

  it('should show create form when Add Connector is clicked', async () => {
    apiGet.mockResolvedValue({ connectors: [] });

    render(<ConnectorsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no connectors configured/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add new connector/i });
    fireEvent.click(addButton);

    expect(screen.getByText('New Connector')).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it('should create connector on form submit', async () => {
    const user = userEvent.setup();
    apiGet.mockResolvedValue({ connectors: [] });
    apiPost.mockResolvedValue({ success: true });

    render(<ConnectorsPage />);

    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add new connector/i });
      fireEvent.click(addButton);
    });

    // Fill form
    await user.type(screen.getByLabelText(/name/i), 'New Connector');
    await user.type(screen.getByLabelText(/host/i), 'test.example.com');

    // Submit
    const createButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith(
        '/api/connectors',
        expect.objectContaining({
          name: 'New Connector',
          host: 'test.example.com',
        })
      );
    });
  });

  it('should display error state on fetch failure', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));

    render(<ConnectorsPage />);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
