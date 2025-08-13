import type { 
  Client, 
  Appointment, 
  ApiResponse 
} from '../../types';
import { communicationService } from './communicationService';
import { db } from '../db';

export interface AutomationJob {
  id: string;
  type: 'birthday_greeting' | 'appointment_reminder_24h' | 'appointment_reminder_2h' | 'post_care_followup';
  clientId: string;
  appointmentId?: string | undefined;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  lastAttempt?: Date | undefined;
  error?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationStats {
  totalJobs: number;
  pendingJobs: number;
  sentJobs: number;
  failedJobs: number;
  birthdayGreetings: number;
  appointmentReminders: number;
  postCareFollowups: number;
}

class AutomationService {
  private maxRetries = 3;
  private retryDelay = 60000; // 1 minute

  /**
   * Schedule birthday greetings for all clients with birthdays today
   */
  async scheduleBirthdayGreetings(): Promise<void> {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    // Get clients with birthdays today
    const clients = await db.client.findMany({
      where: {
        birthDate: {
          not: null
        }
      }
    });

    const birthdayClients = clients.filter(client => {
      if (!client.birthDate) return false;
      
      const birthDate = new Date(client.birthDate);
      return birthDate.getMonth() + 1 === todayMonth && 
             birthDate.getDate() === todayDay;
    });

    // Schedule jobs for birthday clients
    for (const client of birthdayClients) {
      await this.scheduleJob({
        type: 'birthday_greeting',
        clientId: client.id,
        scheduledFor: new Date() // Send immediately
      });
    }
  }

  /**
   * Schedule appointment reminders
   */
  async scheduleAppointmentReminders(): Promise<void> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const in2Hours = new Date(now);
    in2Hours.setHours(in2Hours.getHours() + 2);

    // Get appointments for tomorrow (24h reminders)
    const tomorrowAppointments = await db.appointment.findMany({
      where: {
        startTime: {
          gte: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()),
          lt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1)
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      },
      include: {
        client: true,
        service: true
      }
    });

    // Schedule 24h reminders
    for (const appointment of tomorrowAppointments) {
      await this.scheduleJob({
        type: 'appointment_reminder_24h',
        clientId: appointment.clientId,
        appointmentId: appointment.id,
        scheduledFor: new Date() // Send now for tomorrow's appointments
      });
    }

    // Get appointments in 2 hours (2h reminders)
    const upcomingAppointments = await db.appointment.findMany({
      where: {
        startTime: {
          gte: in2Hours,
          lt: new Date(in2Hours.getTime() + 30 * 60000) // 30 minute window
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      },
      include: {
        client: true,
        service: true
      }
    });

    // Schedule 2h reminders
    for (const appointment of upcomingAppointments) {
      await this.scheduleJob({
        type: 'appointment_reminder_2h',
        clientId: appointment.clientId,
        appointmentId: appointment.id,
        scheduledFor: new Date() // Send now
      });
    }
  }

  /**
   * Schedule post-care follow-ups
   */
  async schedulePostCareFollowups(): Promise<void> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Get completed appointments from 3 days ago
    const completedAppointments = await db.appointment.findMany({
      where: {
        status: 'COMPLETED',
        endTime: {
          gte: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate()),
          lt: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate() + 1)
        }
      },
      include: {
        client: true,
        service: true
      }
    });

    // Schedule follow-up jobs
    for (const appointment of completedAppointments) {
      await this.scheduleJob({
        type: 'post_care_followup',
        clientId: appointment.clientId,
        appointmentId: appointment.id,
        scheduledFor: new Date() // Send now
      });
    }
  }

  /**
   * Schedule a new automation job
   */
  async scheduleJob(jobData: {
    type: AutomationJob['type'];
    clientId: string;
    appointmentId?: string;
    scheduledFor: Date;
  }): Promise<AutomationJob> {
    // Check if job already exists to avoid duplicates
    const existingJob = await this.findExistingJob(
      jobData.type,
      jobData.clientId,
      jobData.appointmentId
    );

    if (existingJob) {
      return existingJob;
    }

    const job: Omit<AutomationJob, 'id'> = {
      ...jobData,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store job in database (using a simple table for automation jobs)
    const response = await fetch('/api/automation/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(job),
    });

    if (!response.ok) {
      throw new Error('Failed to schedule automation job');
    }

    const result: ApiResponse<AutomationJob> = await response.json();
    return result.data;
  }

  /**
   * Process pending automation jobs
   */
  async processPendingJobs(): Promise<void> {
    const now = new Date();

    // Get pending jobs that are due
    const response = await fetch(`/api/automation/jobs?status=pending&due=${now.toISOString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch pending jobs');
    }

    const result: ApiResponse<AutomationJob[]> = await response.json();
    const pendingJobs = result.data;

    for (const job of pendingJobs) {
      await this.processJob(job);
    }
  }

  /**
   * Process a single automation job
   */
  private async processJob(job: AutomationJob): Promise<void> {
    try {
      await this.updateJobStatus(job.id, 'pending', job.attempts + 1);

      switch (job.type) {
        case 'birthday_greeting':
          await this.processBirthdayGreeting(job);
          break;
        case 'appointment_reminder_24h':
        case 'appointment_reminder_2h':
          await this.processAppointmentReminder(job);
          break;
        case 'post_care_followup':
          await this.processPostCareFollowup(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      await this.updateJobStatus(job.id, 'sent');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (job.attempts >= this.maxRetries) {
        await this.updateJobStatus(job.id, 'failed', job.attempts, errorMessage);
      } else {
        // Schedule retry
        const retryTime = new Date(Date.now() + this.retryDelay * job.attempts);
        await this.updateJobStatus(job.id, 'pending', job.attempts, errorMessage, retryTime);
      }
    }
  }

  /**
   * Process birthday greeting job
   */
  private async processBirthdayGreeting(job: AutomationJob): Promise<void> {
    const client = await this.getClient(job.clientId);
    if (!client) {
      throw new Error(`Client not found: ${job.clientId}`);
    }

    await communicationService.sendBirthdayGreeting(client);
  }

  /**
   * Process appointment reminder job
   */
  private async processAppointmentReminder(job: AutomationJob): Promise<void> {
    if (!job.appointmentId) {
      throw new Error('Appointment ID required for reminder job');
    }

    const appointment = await this.getAppointmentWithDetails(job.appointmentId);
    if (!appointment) {
      throw new Error(`Appointment not found: ${job.appointmentId}`);
    }

    const reminderType = job.type === 'appointment_reminder_24h' ? '24h' : '2h';
    await communicationService.sendAppointmentReminder(appointment, reminderType);
  }

  /**
   * Process post-care follow-up job
   */
  private async processPostCareFollowup(job: AutomationJob): Promise<void> {
    if (!job.appointmentId) {
      throw new Error('Appointment ID required for post-care follow-up job');
    }

    const appointment = await this.getAppointmentWithDetails(job.appointmentId);
    if (!appointment) {
      throw new Error(`Appointment not found: ${job.appointmentId}`);
    }

    await communicationService.sendPostCareFollowup(appointment);
  }

  /**
   * Get client by ID
   */
  private async getClient(clientId: string): Promise<Client | null> {
    const response = await fetch(`/api/clients/${clientId}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch client: ${response.statusText}`);
    }

    const result: ApiResponse<Client> = await response.json();
    return result.data;
  }

  /**
   * Get appointment with client and service details
   */
  private async getAppointmentWithDetails(appointmentId: string): Promise<
    (Appointment & { client: Client; service: { name: string } }) | null
  > {
    const response = await fetch(`/api/appointments/${appointmentId}?include=client,service`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch appointment: ${response.statusText}`);
    }

    const result: ApiResponse<any> = await response.json();
    return result.data;
  }

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: string,
    status: AutomationJob['status'],
    attempts?: number,
    error?: string,
    scheduledFor?: Date
  ): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
      lastAttempt: new Date()
    };

    if (attempts !== undefined) updateData.attempts = attempts;
    if (error !== undefined) updateData.error = error;
    if (scheduledFor !== undefined) updateData.scheduledFor = scheduledFor;

    const response = await fetch(`/api/automation/jobs/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error('Failed to update job status');
    }
  }

  /**
   * Find existing job to avoid duplicates
   */
  private async findExistingJob(
    type: AutomationJob['type'],
    clientId: string,
    appointmentId?: string
  ): Promise<AutomationJob | null> {
    const params = new URLSearchParams({
      type,
      clientId,
      status: 'pending'
    });

    if (appointmentId) {
      params.append('appointmentId', appointmentId);
    }

    const response = await fetch(`/api/automation/jobs?${params.toString()}`);
    
    if (!response.ok) {
      return null;
    }

    const result: ApiResponse<AutomationJob[]> = await response.json();
    return result.data.length > 0 ? result.data[0] || null : null;
  }

  /**
   * Get automation statistics
   */
  async getAutomationStats(): Promise<AutomationStats> {
    const response = await fetch('/api/automation/stats');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch automation stats: ${response.statusText}`);
    }

    const result: ApiResponse<AutomationStats> = await response.json();
    return result.data;
  }

  /**
   * Get automation jobs with filters
   */
  async getJobs(filters: {
    status?: AutomationJob['status'];
    type?: AutomationJob['type'];
    clientId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AutomationJob[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/automation/jobs?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch automation jobs: ${response.statusText}`);
    }

    const result: ApiResponse<AutomationJob[]> = await response.json();
    return result.data;
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string): Promise<void> {
    await this.updateJobStatus(jobId, 'cancelled');
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<void> {
    await this.updateJobStatus(jobId, 'pending', 0, undefined, new Date());
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(olderThanDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const response = await fetch('/api/automation/jobs/cleanup', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cutoffDate: cutoffDate.toISOString() }),
    });

    if (!response.ok) {
      throw new Error('Failed to cleanup old jobs');
    }
  }

  /**
   * Run all automation tasks (to be called by cron job)
   */
  async runAutomationTasks(): Promise<void> {
    try {
      // Schedule new jobs
      await this.scheduleBirthdayGreetings();
      await this.scheduleAppointmentReminders();
      await this.schedulePostCareFollowups();

      // Process pending jobs
      await this.processPendingJobs();

      // Cleanup old jobs
      await this.cleanupOldJobs();
    } catch (error) {
      
      throw error;
    }
  }
}

// Export singleton instance
export const automationService = new AutomationService();
export default automationService;

// Types are already exported above