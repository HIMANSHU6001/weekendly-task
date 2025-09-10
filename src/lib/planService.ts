import { Plan } from '@/lib/types';

class PlanService {
  private baseUrl = '/api/plans';

  async createPlan(userId: string, name: string, color: string): Promise<Plan> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, name, color }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create plan failed:', response.status, errorText);
      throw new Error(`Failed to create plan: ${response.status}`);
    }
    return response.json();
  }

  async updatePlan(userId: string, planId: string, updates: Partial<Omit<Plan, 'id'>>): Promise<void> {
    console.log('Updating plan:', { userId, planId, updates });

    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, planId, updates }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update plan failed:', response.status, errorText);
      throw new Error(`Failed to update plan: ${response.status} - ${errorText}`);
    }
  }

  async deletePlan(userId: string, planId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}?userId=${userId}&planId=${planId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete plan failed:', response.status, errorText);
      throw new Error(`Failed to delete plan: ${response.status}`);
    }
  }

  async getPublicPlan(userId: string, planId: string): Promise<Plan> {
    const response = await fetch(`${this.baseUrl}/public/${userId}/${planId}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Get public plan failed:', response.status, errorText);
      throw new Error(`Failed to fetch public plan: ${response.status}`);
    }
    return response.json();
  }
}

export const planService = new PlanService();
