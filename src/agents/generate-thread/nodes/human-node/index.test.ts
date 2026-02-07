import { jest } from '@jest/globals';
import { GenerateThreadState } from '../../state.js';

// Mock dependencies using unstable_mockModule
jest.unstable_mockModule('@langchain/langgraph', () => ({
  interrupt: jest.fn(),
  END: 'END',
  __esModule: true,
}));

jest.unstable_mockModule('../../../../utils/date.js', () => ({
  parseDateResponse: jest.fn(),
  getNextSaturdayDate: jest.fn(() => new Date('2024-01-01T12:00:00Z')),
  PRIORITY_LEVELS: ['p1', 'p2', 'p3'],
  __esModule: true,
}));

jest.unstable_mockModule('../../../utils.js', () => ({
  processImageInput: jest.fn(),
  __esModule: true,
}));

jest.unstable_mockModule('../../../shared/nodes/route-response.js', () => ({
  routeResponse: jest.fn(),
  formatInTimeZone: jest.fn(),
  __esModule: true,
}));

// Import modules dynamically after mocking
const { humanNode } = await import('./index.js');
const { interrupt } = await import('@langchain/langgraph');
const { parseDateResponse } = await import('../../../../utils/date.js');

describe('humanNode', () => {
  const mockState: GenerateThreadState = {
    threadPosts: [{ index: 0, text: 'Post 1' }],
    reports: [],
    totalPosts: 1,
    threadPlan: '',
    scheduleDate: new Date('2024-01-01T12:00:00Z'),
    userResponse: undefined,
    next: undefined,
    image: undefined,
  };

  const mockConfig = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invalidDate state when date is invalid', async () => {
    (interrupt as jest.Mock).mockReturnValue([{
      type: 'edit',
      args: {
        args: {
          date: 'invalid-date',
          post_0: 'Post 1',
        },
      },
    }]);

    (parseDateResponse as jest.Mock).mockReturnValue(undefined);

    const result = await humanNode(mockState, mockConfig as any);
    expect(result).toEqual({
      next: 'invalidDate',
      userResponse: 'invalid-date',
    });
  });
});
