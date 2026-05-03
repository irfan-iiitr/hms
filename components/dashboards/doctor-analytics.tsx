"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DoctorAnalytics } from "@/lib/types"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown, Minus, Users, Calendar, FileText, Pill, Clock, Star } from "lucide-react"
import { useI18n } from "@/lib/i18n"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

interface DoctorAnalyticsProps {
  analytics: DoctorAnalytics | null
  loading?: boolean
}

export function DoctorAnalyticsComponent({ analytics, loading }: DoctorAnalyticsProps) {
  const { t } = useI18n()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">{t("analyticsWidget.noData")}</p>
        </CardContent>
      </Card>
    )
  }

  const { patientStats, demographics, appointmentAnalytics, medicalInsights, performanceMetrics, trends } = analytics

  const renderTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  // Prepare data for charts
  const genderData = Object.entries(demographics.gender).map(([name, value]) => ({ name, value }))
  const ageData = Object.entries(demographics.ageGroups).map(([name, value]) => ({ name, value }))

  const hourlyData = appointmentAnalytics.hourlyDistribution
    .map((count, hour) => ({ hour: `${hour}:00`, appointments: count }))
    .filter((d) => d.appointments > 0)

  const dailyData = Object.entries(appointmentAnalytics.dailyDistribution).map(([day, count]) => ({
    day,
    appointments: count,
  }))

  const diagnosesData = medicalInsights.topDiagnoses.slice(0, 5)
  const medicationsData = medicalInsights.topMedications.slice(0, 5)

  const seasonalTrendsData = medicalInsights.seasonalTrends.map((trend) => ({
    month: trend.month,
    diagnoses: trend.totalDiagnoses,
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analyticsWidget.totalPatients")}
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientStats.totalPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("analyticsWidget.newThisMonth", undefined, {
                count: String(patientStats.newPatientsMonth),
              })}
            </p>
          </CardContent>
        </Card>

        {/* Appointments This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analyticsWidget.appointmentsMonth")}
            </CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.totalAppointmentsMonth}</div>
            <div className="flex items-center gap-2 mt-1">
              {trends.appointments && renderTrendIcon(trends.appointments.trend)}
              <p className="text-xs text-muted-foreground">
                {t("analyticsWidget.vsLastMonth", undefined, {
                  pct: String(trends.appointments?.percentage || 0),
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Medical Records */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analyticsWidget.recordsCreated")}
            </CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicalInsights.totalRecords}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("analyticsWidget.thisMonth", undefined, {
                count: String(performanceMetrics.totalRecordsMonth),
              })}
            </p>
          </CardContent>
        </Card>

        {/* Prescriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analyticsWidget.prescriptions")}
            </CardTitle>
            <Pill className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicalInsights.totalPrescriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("analyticsWidget.thisMonth", undefined, {
                count: String(performanceMetrics.totalPrescriptionsMonth),
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analyticsWidget.dailyConsultations")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.consultationsPerDay}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("analyticsWidget.avgPerDay")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analyticsWidget.completionRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentAnalytics.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("analyticsWidget.appointmentsOfTotal", undefined, {
                completed: String(appointmentAnalytics.completed),
                total: String(appointmentAnalytics.total),
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analyticsWidget.avgResponseTime")}
            </CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.averageResponseTime}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("analyticsWidget.toPatientQueries")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analyticsWidget.patientSatisfaction")}
            </CardTitle>
            <Star className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.patientSatisfaction}/5.0</div>
            <p className="text-xs text-muted-foreground mt-1">{t("analyticsWidget.avgRating")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("analyticsWidget.genderDistribution")}</CardTitle>
            <CardDescription>{t("analyticsWidget.demographicsByGender")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("analyticsWidget.ageDistribution")}</CardTitle>
            <CardDescription>{t("analyticsWidget.demographicsByAge")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle>{t("analyticsWidget.apptByHour")}</CardTitle>
            <CardDescription>
              {t("analyticsWidget.peakHours", undefined, { hour: String(appointmentAnalytics.peakHour) })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Days */}
        <Card>
          <CardHeader>
            <CardTitle>{t("analyticsWidget.apptByDay")}</CardTitle>
            <CardDescription>
              {t("analyticsWidget.peakDay", undefined, { day: String(appointmentAnalytics.peakDay) })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t("analyticsWidget.apptStatusOverview")}</CardTitle>
          <CardDescription>{t("analyticsWidget.currentMonthStats")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("analyticsWidget.completed")}</p>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{appointmentAnalytics.completed}</div>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                  {appointmentAnalytics.completionRate}%
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("analyticsWidget.scheduled")}</p>
              <div className="text-2xl font-bold">{appointmentAnalytics.scheduled}</div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("analyticsWidget.cancelled")}</p>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{appointmentAnalytics.cancelled}</div>
                <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
                  {appointmentAnalytics.cancellationRate}%
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("analyticsWidget.noShowRate")}</p>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{appointmentAnalytics.noShowRate}%</div>
              </div>
            </div>
          </div>

          {/* Cancellation Reasons */}
          {Object.keys(appointmentAnalytics.cancellationReasons).length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">{t("analyticsWidget.cancellationReasons")}</h4>
              <div className="space-y-2">
                {Object.entries(appointmentAnalytics.cancellationReasons)
                  .slice(0, 5)
                  .map(([reason, count]) => (
                    <div key={reason} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{reason}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle>{t("analyticsWidget.mostCommonDiagnoses")}</CardTitle>
            <CardDescription>{t("analyticsWidget.top5Diagnoses")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={diagnosesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="diagnosis" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Medications */}
        <Card>
          <CardHeader>
            <CardTitle>{t("analyticsWidget.mostPrescribedMeds")}</CardTitle>
            <CardDescription>{t("analyticsWidget.top5Medications")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={medicationsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="medication" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Seasonal Trends */}
      <Card>
        <CardHeader>
          <CardTitle>{t("analyticsWidget.diagnosisTrends6m")}</CardTitle>
          <CardDescription>{t("analyticsWidget.monthlyDiagnosisPatterns")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={seasonalTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="diagnoses"
                name={t("analyticsWidget.legendDiagnoses")}
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Show top diagnosis per month */}
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">{t("analyticsWidget.topDiagnosisByMonth")}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {medicalInsights.seasonalTrends.map((trend) => (
                <div key={trend.month} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{trend.month}</p>
                  <p className="text-sm font-medium">{trend.topDiagnosis}</p>
                  <Badge variant="outline" className="text-xs">
                    {t("analyticsWidget.casesCount", undefined, {
                      count: String(trend.totalDiagnoses),
                    })}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Flow */}
      <Card>
        <CardHeader>
          <CardTitle>{t("analyticsWidget.patientFlow")}</CardTitle>
          <CardDescription>{t("analyticsWidget.newVsReturning")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("analyticsWidget.totalPatientsSeen")}</p>
              <div className="text-3xl font-bold">{patientStats.monthly}</div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("analyticsWidget.newPatients")}</p>
              <div className="text-3xl font-bold text-blue-600">{patientStats.newPatientsMonth}</div>
              <p className="text-xs text-muted-foreground">
                {t("analyticsWidget.pctOfTotal", undefined, {
                  pct:
                    patientStats.monthly > 0
                      ? ((patientStats.newPatientsMonth / patientStats.monthly) * 100).toFixed(1)
                      : "0",
                })}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("analyticsWidget.returningPatients")}</p>
              <div className="text-3xl font-bold text-green-600">{patientStats.returningPatientsMonth}</div>
              <p className="text-xs text-muted-foreground">
                {t("analyticsWidget.pctOfTotal", undefined, {
                  pct:
                    patientStats.monthly > 0
                      ? ((patientStats.returningPatientsMonth / patientStats.monthly) * 100).toFixed(1)
                      : "0",
                })}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("analyticsWidget.thisWeek")}</span>
              <span className="font-medium">
                {t("analyticsWidget.patientsCount", undefined, { count: String(patientStats.weekly) })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("analyticsWidget.today")}</span>
              <span className="font-medium">
                {t("analyticsWidget.patientsCount", undefined, { count: String(patientStats.daily) })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
