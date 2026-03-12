import * as subscriptionStore from './subscriptionStore.js';

// Middleware to check if user can create courses
export async function requireCourseCreation(req, res, next) {
  try {
    const canCreate = await subscriptionStore.canCreateCourse(req.user.id);
    if (!canCreate) {
      const limits = await subscriptionStore.getUserPlanLimits(req.user.id);
      return res.status(403).json({ 
        success: false, 
        error: `Course limit reached. Your plan allows ${limits.max_courses_per_month} courses per month.`,
        upgradeRequired: true
      });
    }
    next();
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

// Middleware to check if user can create exams with specific question count
export async function requireExamCreation(req, res, next) {
  try {
    const questionCount = req.body.num_questions || 10;
    const canCreate = await subscriptionStore.canCreateExamWithQuestions(req.user.id, questionCount);
    if (!canCreate) {
      const limits = await subscriptionStore.getUserPlanLimits(req.user.id);
      return res.status(403).json({ 
        success: false, 
        error: `Question limit exceeded. Your plan allows ${limits.max_questions_per_exam} questions per exam.`,
        upgradeRequired: true
      });
    }
    next();
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

// Middleware to check if user can export PDF
export async function requirePdfExport(req, res, next) {
  try {
    const limits = await subscriptionStore.getUserPlanLimits(req.user.id);
    if (!limits.pdf_export) {
      return res.status(403).json({ 
        success: false, 
        error: 'PDF export is not available on your plan. Upgrade to access this feature.',
        upgradeRequired: true
      });
    }
    next();
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

// Middleware to check if user can export LMS
export async function requireLmsExport(req, res, next) {
  try {
    const limits = await subscriptionStore.getUserPlanLimits(req.user.id);
    if (!limits.lms_export) {
      return res.status(403).json({ 
        success: false, 
        error: 'LMS export is not available on your plan. Upgrade to Pro or Institution plan to access this feature.',
        upgradeRequired: true
      });
    }
    next();
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

// Middleware to check if user has API access
export async function requireApiAccess(req, res, next) {
  try {
    const limits = await subscriptionStore.getUserPlanLimits(req.user.id);
    if (!limits.api_access) {
      return res.status(403).json({ 
        success: false, 
        error: 'API access is not available on your plan. Upgrade to Institution plan to access this feature.',
        upgradeRequired: true
      });
    }
    next();
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

// Middleware to check if user can do mass generation
export async function requireMassGeneration(req, res, next) {
  try {
    const limits = await subscriptionStore.getUserPlanLimits(req.user.id);
    if (!limits.mass_generation) {
      return res.status(403).json({ 
        success: false, 
        error: 'Mass generation is not available on your plan. Upgrade to Institution plan to access this feature.',
        upgradeRequired: true
      });
    }
    next();
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

// Function to track usage after successful operations
export async function trackUsage(userId, usageType) {
  try {
    await subscriptionStore.updateMonthlyUsage(userId, usageType);
  } catch (e) {
    console.error('Failed to track usage:', e);
  }
}
