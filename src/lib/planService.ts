import { Plan } from '@/lib/types';

class PlanService {
  private baseUrl = '/api/plans';

  async getPlans(userId: string): Promise<Plan[]> {
    const response = await fetch(`${this.baseUrl}?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch plans');
    }
    return response.json();
  }

  async createPlan(userId: string, name: string, color: string): Promise<Plan> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, name, color }),
    });

    if (!response.ok) {
      throw new Error('Failed to create plan');
    }
    return response.json();
  }

  async updatePlan(userId: string, planId: string, updates: Partial<Omit<Plan, 'id'>>): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, planId, updates }),
    });

    if (!response.ok) {
      throw new Error('Failed to update plan');
    }
  }

  async deletePlan(userId: string, planId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}?userId=${userId}&planId=${planId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete plan');
    }
  }

}

export const planService = new PlanService();
