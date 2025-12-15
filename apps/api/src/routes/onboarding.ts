import { Hono } from 'hono';
import { onboardingService } from '../services/onboarding';

const onboardingRouter = new Hono();

// Get onboarding progress for current organization
onboardingRouter.get('/progress', async (c) => {
  try {
    // In production, get organizationId from authenticated user session
    // For now, we'll use a mock organization ID
    const organizationId = c.req.header('x-organization-id') || 'demo-org-id';

    const progress = await onboardingService.getProgress(organizationId);

    return c.json(progress);
  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    return c.json(
      {
        error: 'Failed to fetch onboarding progress',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Mark onboarding as complete
onboardingRouter.post('/complete', async (c) => {
  try {
    const organizationId = c.req.header('x-organization-id') || 'demo-org-id';

    await onboardingService.markComplete(organizationId);

    return c.json({
      success: true,
      message: 'Onboarding marked as complete',
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return c.json(
      {
        error: 'Failed to complete onboarding',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Check if onboarding is complete
onboardingRouter.get('/status', async (c) => {
  try {
    const organizationId = c.req.header('x-organization-id') || 'demo-org-id';

    const isComplete = await onboardingService.isComplete(organizationId);

    return c.json({
      complete: isComplete,
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return c.json(
      {
        error: 'Failed to check onboarding status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default onboardingRouter;
