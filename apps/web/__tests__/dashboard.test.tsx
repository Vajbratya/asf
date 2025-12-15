/**
 * Dashboard Page Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/(dashboard)/dashboard/page';

// Mock the API
jest.mock('@/lib/api', () => ({
  apiGet: jest.fn(),
}));

const { apiGet } = require('@/lib/api');

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    apiGet.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<DashboardPage />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('should display metrics after successful load', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url.includes('/api/metrics?period=24h')) {
        return Promise.resolve({
          messages: {
            total: 100,
            successRate: '95%',
            byStatus: { processed: 95, failed: 5 },
          },
          connectors: [],
        });
      }
      if (url.includes('/api/metrics/recent-messages')) {
        return Promise.resolve({ messages: [] });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages Today')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    apiGet.mockRejectedValue(new Error('Failed to fetch data'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it('should display recent messages table', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url.includes('/api/metrics?period=24h')) {
        return Promise.resolve({
          messages: { total: 0, successRate: '0%', byStatus: {} },
          connectors: [],
        });
      }
      if (url.includes('/api/metrics/recent-messages')) {
        return Promise.resolve({
          messages: [
            {
              id: 'msg-123',
              type: 'ADT',
              protocol: 'HL7',
              connector: 'Test Connector',
              status: 'processed',
              createdAt: new Date().toISOString(),
              processingTime: 150,
            },
          ],
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Recent Messages')).toBeInTheDocument();
      expect(screen.getByText('ADT')).toBeInTheDocument();
      expect(screen.getByText('HL7')).toBeInTheDocument();
    });
  });
});
