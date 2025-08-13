import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { automationService } from '../../lib/services/automationService';
import type { AutomationJob, AutomationStats } from '../../lib/services/automationService';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('AutomationService Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Job Scheduling', () => {
    it('should schedule birthday greetings successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await automationService.scheduleBirthdayGreetings();

      expect(fetch).toHaveBeenCalledWith('/api/communications/schedule-birthday-greetings', {
        method: 'POST'
      });
    });

    it('should schedule post-care follow-ups successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await automationService.schedulePostCareFollowups();

      expect(fetch).toHaveBeenCalledWith('/api/communications/schedule-post-care-followups', {
        method: 'POST'
      });
    });

    it('should schedule individual job successfully', async () => {
      const mockJob: AutomationJob = {
        id: 'job_123',
        type: 'birthday_greeting',
        clientId: 'client_123',
        scheduledFor: new Date(),
        status: 'pending',
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockJob })
      });

      const result = await automationService.scheduleJob({
        type: 'birthday_greeting',
        clientId: 'client_123',
        scheduledFor: new Date()
      });

      expect(result).toEqual(mockJob);
      expect(fetch).toHaveBeenCalledWith('/api/automation/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('birthday_greeting')
      });
    });

    it('should handle scheduling errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Database connection failed' })
      });

      await expect(automationService.scheduleBirthdayGreetings())
        .rejects.toThrow('Failed to schedule birthday greetings');
    });
  });

  describe('Job Processing', () => {
    it('should process pending jobs successfully', async () => {
      const mockJobs: AutomationJob[] = [
        {
          id: 'job_123',
          type: 'birthday_greeting',
          clientId: 'client_123',
          scheduledFor: new Date(),
          status: 'pending',
          attempts: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockJobs })
      });

      await automationService.processPendingJobs();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/automation/jobs?status=pending&due=')
      );
    });

    it('should handle job processing errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });

      await expect(automationService.processPendingJobs())
        .rejects.toThrow('Failed to fetch pending jobs');
    });
  });

  describe('Job Management', () => {
    it('should get automation jobs with filters', async () => {
      const mockJobs: AutomationJob[] = [
        {
          id: 'job_123',
          type: 'appointment_reminder_24h',
          clientId: 'client_123',
          appointmentId: 'appointment_123',
          scheduledFor: new Date(),
          status: 'sent',
          attempts: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockJobs })
      });

      const jobs = await automationService.getJobs({
        status: 'sent',
        type: 'appointment_reminder_24h',
        limit: 10
      });

      expect(jobs).toEqual(mockJobs);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=sent&type=appointment_reminder_24h&limit=10')
      );
    });

    it('should cancel job successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await automationService.cancelJob('job_123');

      expect(fetch).toHaveBeenCalledWith('/api/automation/jobs/job_123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('cancelled')
      });
    });

    it('should retry failed job successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await automationService.retryJob('job_123');

      expect(fetch).toHaveBeenCalledWith('/api/automation/jobs/job_123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('pending')
      });
    });

    it('should cleanup old jobs successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { deletedCount: 5, message: 'Deleted 5 old automation jobs' }
        })
      });

      await automationService.cleanupOldJobs(30);

      expect(fetch).toHaveBeenCalledWith('/api/automation/jobs/cleanup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('cutoffDate')
      });
    });
  });

  describe('Statistics', () => {
    it('should get automation statistics successfully', async () => {
      const mockStats: AutomationStats = {
        totalJobs: 100,
        pendingJobs: 5,
        sentJobs: 85,
        failedJobs: 10,
        birthdayGreetings: 20,
        appointmentReminders: 60,
        postCareFollowups: 20
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStats })
      });

      const stats = await automationService.getAutomationStats();

      expect(stats).toEqual(mockStats);
      expect(fetch).toHaveBeenCalledWith('/api/automation/stats');
    });

    it('should handle statistics fetch errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Service Unavailable'
      });

      await expect(automationService.getAutomationStats())
        .rejects.toThrow('Failed to fetch automation stats: Service Unavailable');
    });
  });

  describe('Full Automation Workflow', () => {
    it('should run all automation tasks successfully', async () => {
      // Mock all API calls
      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('schedule-birthday-greetings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true })
          });
        }
        if (url.includes('schedule-post-care-followups')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true })
          });
        }
        if (url.includes('jobs?status=pending')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: [] })
          });
        }
        if (url.includes('cleanup')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: { deletedCount: 0 } })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        });
      });

      await automationService.runAutomationTasks();

      // Verify all automation tasks were called
      expect(fetch).toHaveBeenCalledWith('/api/communications/schedule-birthday-greetings', {
        method: 'POST'
      });
      expect(fetch).toHaveBeenCalledWith('/api/communications/schedule-post-care-followups', {
        method: 'POST'
      });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('jobs?status=pending')
      );
      expect(fetch).toHaveBeenCalledWith('/api/automation/jobs/cleanup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String)
      });
    });

    it('should handle automation task failures', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Service unavailable' })
      });

      await expect(automationService.runAutomationTasks())
        .rejects.toThrow('Failed to schedule birthday greetings');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty job lists', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      const jobs = await automationService.getJobs();
      expect(jobs).toEqual([]);
    });

    it('should handle network timeouts', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Request timeout'));

      await expect(automationService.getAutomationStats())
        .rejects.toThrow('Request timeout');
    });

    it('should handle malformed responses', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(automationService.getAutomationStats())
        .rejects.toThrow('Invalid JSON');
    });

    it('should validate job data before scheduling', async () => {
      await expect(automationService.scheduleJob({
        type: 'invalid_type' as any,
        clientId: 'client_123',
        scheduledFor: new Date()
      })).rejects.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent job scheduling', async () => {
      (fetch as any).mockImplementation(() => Promise.resolve({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { 
            id: crypto.randomUUID(),
            status: 'pending'
          }
        })
      }));

      const jobs = await Promise.all([
        automationService.scheduleJob({
          type: 'birthday_greeting',
          clientId: 'client_1',
          scheduledFor: new Date()
        }),
        automationService.scheduleJob({
          type: 'appointment_reminder_24h',
          clientId: 'client_2',
          appointmentId: 'appointment_1',
          scheduledFor: new Date()
        }),
        automationService.scheduleJob({
          type: 'post_care_followup',
          clientId: 'client_3',
          appointmentId: 'appointment_2',
          scheduledFor: new Date()
        })
      ]);

      expect(jobs).toHaveLength(3);
      jobs.forEach(job => {
        expect(job.status).toBe('pending');
        expect(job.id).toBeDefined();
      });
    });

    it('should handle concurrent statistics requests', async () => {
      const mockStats: AutomationStats = {
        totalJobs: 50,
        pendingJobs: 5,
        sentJobs: 40,
        failedJobs: 5,
        birthdayGreetings: 10,
        appointmentReminders: 30,
        postCareFollowups: 10
      };

      (fetch as any).mockImplementation(() => Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: mockStats })
      }));

      const results = await Promise.all([
        automationService.getAutomationStats(),
        automationService.getAutomationStats(),
        automationService.getAutomationStats()
      ]);

      results.forEach(stats => {
        expect(stats).toEqual(mockStats);
      });
    });
  });
});