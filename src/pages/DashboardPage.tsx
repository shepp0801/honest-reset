import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useActiveProfileId } from '../context/ProfileContext'
import { WeightTrendChart } from '../components/charts/WeightTrendChart'
import { BpTrendChart } from '../components/charts/BpTrendChart'
import { TrendChart } from '../components/charts/TrendChart'
import { MacroProgressCard } from '../components/dashboard/MacroProgressCard'
import { WaterProgressCard } from '../components/dashboard/WaterProgressCard'
import { Alert } from '../components/ui/Alert'
import { WeeklyCheckinStrip } from '../components/dashboard/WeeklyCheckinStrip'
import { VisitSummaryCard } from '../components/dashboard/VisitSummaryCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useWeeklyDashboard } from '../hooks/useWeeklyDashboard'
import { useDashboardData } from '../hooks/useDashboardData'
import { useHealthGoals } from '../hooks/useHealthGoals'
import { todayISO } from '../lib/date'
import { supabase } from '../lib/supabase'

const MOBILE_CHART_HEIGHT = 180
const DESKTOP_CHART_HEIGHT = 120

export function DashboardPage() {
  const { user } = useAuth()
  const profileId = useActiveProfileId()
  const { data, loading, error, refetch } = useDashboardData(profileId)
  const { chartGoals } = useHealthGoals()
  const weekly = useWeeklyDashboard(profileId)
  const [waterAmount, setWaterAmount] = useState('8')
  const [waterSaving, setWaterSaving] = useState(false)
  const [waterMessage, setWaterMessage] = useState('')
  const [waterError, setWaterError] = useState('')

  if (loading) return <LoadingSpinner label="Loading dashboard..." />
  if (error) return <Alert type="error" message={error} />

  const summary = data?.summary
  const macros = summary?.todayMacros ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }

  async function addWater(ounces: number) {
    if (!user || !profileId || ounces <= 0) return

    setWaterSaving(true)
    setWaterError('')
    setWaterMessage('')

    const today = todayISO()
    const currentWater = summary?.todayWaterOz ?? 0
    const newTotal = currentWater + ounces

    const { error: saveError } = await supabase.from('daily_logs').upsert(
      {
        user_id: profileId,
        log_date: today,
        water_oz: newTotal,
      },
      { onConflict: 'user_id,log_date' },
    )

    if (saveError) {
      setWaterError(saveError.message)
    } else {
      setWaterMessage(`Added ${ounces} oz. Today's total is ${newTotal} oz.`)
      await refetch()
    }
    setWaterSaving(false)
  }

  function handleCustomWater() {
    const amount = Number(waterAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      setWaterError('Enter a positive number of ounces.')
      return
    }
    addWater(amount)
  }

  const waterCardProps = {
    ounces: summary?.todayWaterOz ?? 0,
    waterAmount,
    waterSaving,
    onWaterAmountChange: setWaterAmount,
    onAddWater: addWater,
    onCustomAdd: handleCustomWater,
  }

  return (
    <div className="space-y-6 lg:space-y-2">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)] lg:text-xl">
          Dashboard
        </h1>
        {profileId && (
          <div className="hidden lg:block lg:min-w-[20rem] lg:max-w-md lg:flex-1">
            <VisitSummaryCard userId={profileId} compact />
          </div>
        )}
      </div>

      <Alert type="error" message={waterError} onDismiss={() => setWaterError('')} />
      <Alert type="success" message={waterMessage} onDismiss={() => setWaterMessage('')} />

      {weekly.data && <WeeklyCheckinStrip data={weekly.data} compact />}

      {/* Desktop: three-column grid fits one screen without scrolling */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-2">
        <WeightTrendChart
          title="Weight (30 days)"
          data={data?.weightChart ?? []}
          chartHeight={DESKTOP_CHART_HEIGHT}
          compact
          targetWeightLbs={chartGoals.targetWeightLbs}
        />
        <TrendChart
          title="A1C (all time)"
          data={data?.a1cChart ?? []}
          unit="%"
          color="#B88478"
          chartHeight={DESKTOP_CHART_HEIGHT}
          compact
          emptyMessage="Log A1C values on the Labs page"
        />
        <MacroProgressCard
          calories={macros.calories}
          protein={macros.protein}
          carbs={macros.carbs}
          fat={macros.fat}
          compact
        />
        <WaterProgressCard {...waterCardProps} compact />
        <TrendChart
          title="Steps (30 days)"
          data={data?.stepsChart ?? []}
          color="#6E7D66"
          chartHeight={DESKTOP_CHART_HEIGHT}
          compact
          referenceY={chartGoals.dailyStepGoal}
          referenceLabel="Goal"
        />
        <BpTrendChart
          title="Blood pressure (30 days)"
          data={data?.bloodPressureChart ?? []}
          chartHeight={DESKTOP_CHART_HEIGHT}
          compact
          emptyMessage="Log blood pressure on the Daily Log"
          targetSystolic={chartGoals.targetSystolic}
          targetDiastolic={chartGoals.targetDiastolic}
        />
      </div>

      {/* Mobile & tablet: stacked layout */}
      <div className="space-y-4 lg:hidden">
        <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
          <WeightTrendChart
            title="Weight (last 30 days)"
            data={data?.weightChart ?? []}
            chartHeight={MOBILE_CHART_HEIGHT}
            className="h-full"
            targetWeightLbs={chartGoals.targetWeightLbs}
          />
          <TrendChart
            title="A1C (all time)"
            data={data?.a1cChart ?? []}
            unit="%"
            color="#B88478"
            chartHeight={MOBILE_CHART_HEIGHT}
            className="h-full"
            emptyMessage="Log A1C values on the Labs page"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
          <MacroProgressCard
            calories={macros.calories}
            protein={macros.protein}
            carbs={macros.carbs}
            fat={macros.fat}
          />
          <WaterProgressCard {...waterCardProps} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
          <TrendChart
            title="Steps (30 days)"
            data={data?.stepsChart ?? []}
            color="#6E7D66"
            chartHeight={MOBILE_CHART_HEIGHT}
            referenceY={chartGoals.dailyStepGoal}
            referenceLabel="Goal"
          />
          <BpTrendChart
            title="Blood pressure (30 days)"
            data={data?.bloodPressureChart ?? []}
            chartHeight={MOBILE_CHART_HEIGHT}
            className="w-full"
            emptyMessage="Log blood pressure on the Daily Log"
            targetSystolic={chartGoals.targetSystolic}
            targetDiastolic={chartGoals.targetDiastolic}
          />
        </div>

        {profileId && <VisitSummaryCard userId={profileId} />}
      </div>
    </div>
  )
}
