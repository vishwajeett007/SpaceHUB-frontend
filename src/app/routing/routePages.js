import { lazy } from 'react'

export const LandingPage = lazy(
  () => import('../../modules/landing/pages/LandingPage'),
)
export const LoginPage = lazy(
  () => import('../../modules/auth/pages/LoginPage'),
)
export const SignupPage = lazy(
  () => import('../../modules/auth/pages/SignupPage'),
)
export const ForgotPasswordPage = lazy(
  () => import('../../modules/auth/pages/ForgotPasswordPage'),
)
export const ResetPasswordPage = lazy(
  () => import('../../modules/auth/pages/ResetPasswordPage'),
)
export const ProfileSetupPage = lazy(
  () => import('../../modules/profile/pages/ProfileSetupPage'),
)
export const Dashboard = lazy(
  () => import('../../modules/dashboard/pages/Dashboard'),
)
export const CommunityPage = lazy(
  () => import('../../modules/dashboard/pages/CommunityPage'),
)
export const CommunitySettingsPage = lazy(
  () => import('../../modules/dashboard/pages/CommunitySettingsPage'),
)
export const LocalGroupPage = lazy(
  () => import('../../modules/dashboard/pages/LocalGroupPage'),
)
export const LocalGroupSettingsPage = lazy(
  () => import('../../modules/dashboard/pages/LocalGroupSettingsPage'),
)
export const SettingPage = lazy(
  () => import('../../modules/dashboard/pages/SettingPage'),
)
export const DirectMessagePage = lazy(
  () => import('../../modules/dashboard/pages/DirectMessagePage'),
)
export const CreateJoinPage = lazy(
  () => import('../../modules/dashboard/pages/CreateJoinPage'),
)
