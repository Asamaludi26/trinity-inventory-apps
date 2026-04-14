import { useMemo } from 'react';
import type { DepreciationScheduleEntry } from '../types';
import type { DepreciationCalculationData } from '@/validation/depreciation.schema';

/**
 * Hook to calculate depreciation on the frontend
 * Used for previewing depreciation schedule before submission
 */
export function useDepreciationCalculation(data?: DepreciationCalculationData) {
  return useMemo(() => {
    if (!data) {
      return {
        schedule: [] as DepreciationScheduleEntry[],
        monthlyExpense: '0',
        totalDepreciation: '0',
        residualValue: '0',
      };
    }

    const acquiredPrice = parseFloat(data.acquiredPrice.toString());
    const usefulLifeYears = data.usefulLifeYears;
    const salvageValue = parseFloat(data.salvageValue?.toString() || '0');
    const method = data.method;

    // Calculate schedule
    const schedule: DepreciationScheduleEntry[] = [];
    const totalMonths = usefulLifeYears * 12;

    if (method === 'STRAIGHT_LINE') {
      // D = (Cost - Salvage) / Useful Life (in months)
      const depreciableAmount = acquiredPrice - salvageValue;
      const monthlyDepreciation = depreciableAmount / totalMonths;

      let beginningValue = acquiredPrice;
      let cumulativeDepreciation = 0;

      for (let i = 0; i < totalMonths; i++) {
        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        const currentDate = new Date(startDate);
        currentDate.setMonth(currentDate.getMonth() + i);

        const depreciation = monthlyDepreciation;
        const endingValue = beginningValue - depreciation;
        cumulativeDepreciation += depreciation;

        schedule.push({
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          beginningValue: beginningValue.toFixed(2),
          depreciation: depreciation.toFixed(2),
          endingValue: endingValue.toFixed(2),
          cumulativeDepreciation: cumulativeDepreciation.toFixed(2),
        });

        beginningValue = endingValue;
      }

      return {
        schedule,
        monthlyExpense: monthlyDepreciation.toFixed(2),
        totalDepreciation: (acquiredPrice - salvageValue).toFixed(2),
        residualValue: salvageValue.toFixed(2),
      };
    } else if (method === 'DECLINING_BALANCE') {
      // D = Remaining Value * Rate (where Rate = 2 / Useful Life)
      const rate = 2 / usefulLifeYears;

      let beginningValue = acquiredPrice;
      let cumulativeDepreciation = 0;

      for (let i = 0; i < totalMonths; i++) {
        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        const currentDate = new Date(startDate);
        currentDate.setMonth(currentDate.getMonth() + i);

        // Monthly depreciation = annual rate / 12
        const monthlyRate = rate / 12;
        const depreciation = beginningValue * monthlyRate;
        const endingValue = beginningValue - depreciation;
        cumulativeDepreciation += depreciation;

        schedule.push({
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          beginningValue: beginningValue.toFixed(2),
          depreciation: depreciation.toFixed(2),
          endingValue: endingValue.toFixed(2),
          cumulativeDepreciation: cumulativeDepreciation.toFixed(2),
        });

        beginningValue = endingValue;
      }

      // Annual depreciation (for display)
      const annualDepreciation = acquiredPrice * rate;

      return {
        schedule,
        monthlyExpense: (annualDepreciation / 12).toFixed(2),
        totalDepreciation: (acquiredPrice - beginningValue).toFixed(2),
        residualValue: Math.max(beginningValue, salvageValue).toFixed(2),
      };
    }

    return {
      schedule,
      monthlyExpense: '0',
      totalDepreciation: '0',
      residualValue: salvageValue.toFixed(2),
    };
  }, [data]);
}

/**
 * Hook for simple depreciation calculation (single values only)
 * Used in forms where user needs quick calculation preview
 */
export function useSimpleDepreciationCalculation(
  acquiredPrice?: number | string,
  usefulLifeYears?: number,
  method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' = 'STRAIGHT_LINE',
  salvageValue?: number | string,
) {
  return useMemo(() => {
    if (!acquiredPrice || !usefulLifeYears) {
      return { monthlyExpense: '0', yearlyExpense: '0', endValue: '0' };
    }

    const cost = parseFloat(acquiredPrice.toString());
    const salvage = parseFloat(salvageValue?.toString() || '0');

    if (method === 'STRAIGHT_LINE') {
      const depreciableAmount = cost - salvage;
      const yearlyExpense = depreciableAmount / usefulLifeYears;
      const monthlyExpense = yearlyExpense / 12;

      return {
        monthlyExpense: monthlyExpense.toFixed(2),
        yearlyExpense: yearlyExpense.toFixed(2),
        endValue: salvage.toFixed(2),
      };
    } else {
      // Declining balance
      const rate = 2 / usefulLifeYears;
      const yearlyExpense = cost * rate;
      const monthlyExpense = yearlyExpense / 12;

      return {
        monthlyExpense: monthlyExpense.toFixed(2),
        yearlyExpense: yearlyExpense.toFixed(2),
        endValue: (cost * Math.pow(1 - rate, usefulLifeYears)).toFixed(2),
      };
    }
  }, [acquiredPrice, usefulLifeYears, method, salvageValue]);
}
