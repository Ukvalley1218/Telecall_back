import express from 'express';
import marketingController from './controller.js';
import campaignController from './campaignController.js';
import marketingToolController from './marketingToolController.js';
import leadController from './leadController.js';
import budgetController from './budgetController.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Dashboard routes
router.get('/dashboard/stats', marketingController.getDashboardStats);
router.get('/dashboard/lead-generation', marketingController.getLeadGenerationData);
router.get('/dashboard/campaign-roi', marketingController.getCampaignROIData);
router.get('/dashboard/recent-activity', marketingController.getRecentActivity);
router.get('/dashboard/campaign-comparison', marketingController.getCampaignComparison);
router.get('/dashboard/leads-by-source', marketingController.getLeadsBySource);

// Campaign CRUD routes
router.get('/campaigns', campaignController.getCampaigns);
router.get('/campaigns/stats', campaignController.getCampaignStats);
router.get('/campaigns/:id', campaignController.getCampaignById);
router.post('/campaigns', campaignController.createCampaign);
router.put('/campaigns/:id', campaignController.updateCampaign);
router.patch('/campaigns/:id', campaignController.updateCampaign);
router.delete('/campaigns/:id', campaignController.deleteCampaign);
router.put('/campaigns/:id/leads', campaignController.updateCampaignLeads);

// Marketing Tool Connection routes
router.get('/tools', marketingToolController.getTools);
router.get('/tools/connected', marketingToolController.getConnectedTools);
router.get('/tools/stats', marketingToolController.getToolStats);
router.get('/tools/lead-sources', marketingToolController.getLeadSources);
router.get('/tools/:id', marketingToolController.getToolById);
router.post('/tools/:toolId/connect', marketingToolController.connectTool);
router.post('/tools/:toolId/disconnect', marketingToolController.disconnectTool);
router.patch('/tools/:id/config', marketingToolController.updateToolConfig);
router.post('/tools/:id/sync', marketingToolController.syncToolLeads);
router.post('/tools/:toolId/test', marketingToolController.testConnection);

// Lead CRUD routes
router.get('/leads', leadController.getLeads);
router.get('/leads/stats', leadController.getLeadStats);
router.get('/leads/convertible', leadController.getConvertibleLeads);
router.get('/leads/:id', leadController.getLeadById);
router.post('/leads', leadController.createLead);
router.put('/leads/:id', leadController.updateLead);
router.patch('/leads/:id/assign', leadController.assignLead);
router.patch('/leads/:id/unassign', leadController.unassignLead);
router.delete('/leads/:id', leadController.deleteLead);
router.post('/leads/bulk', leadController.bulkCreateLeads);
router.post('/leads/:id/convert', leadController.convertLead);

// Budget & ROI routes
router.get('/budget/stats', budgetController.getBudgetStats);
router.get('/budget/channel-roi', budgetController.getChannelROI);

export default router;