import {
  ProfileSetupRoute,
  ProtectedRoute,
  PublicRoute,
  ResetPasswordRoute,
} from '../../shared'
import {
  CommunityPage,
  CommunitySettingsPage,
  CreateJoinPage,
  Dashboard,
  DirectMessagePage,
  ForgotPasswordPage,
  LandingPage,
  LocalGroupPage,
  LocalGroupSettingsPage,
  LoginPage,
  ProfileSetupPage,
  ResetPasswordPage,
  SettingPage,
  SignupPage,
} from './routePages'

export const appRoutes = [
  { path: '/', Page: LandingPage },
  { path: '/login', Page: LoginPage, Guard: PublicRoute },
  { path: '/signup', Page: SignupPage, Guard: PublicRoute },
  {
    path: '/forgot-password',
    Page: ForgotPasswordPage,
    Guard: PublicRoute,
  },
  { path: '/reset', Page: ResetPasswordPage, Guard: ResetPasswordRoute },
  { path: '/dashboard', Page: Dashboard, Guard: ProtectedRoute },
  { path: '/dashboard/discover', Page: Dashboard, Guard: ProtectedRoute },
  {
    path: '/dashboard/chat/:friendId',
    Page: Dashboard,
    Guard: ProtectedRoute,
  },
  {
    path: '/dashboard/settings',
    Page: SettingPage,
    Guard: ProtectedRoute,
  },
  {
    path: '/dashboard/direct-message',
    Page: DirectMessagePage,
    Guard: ProtectedRoute,
  },
  {
    path: '/dashboard/create-join',
    Page: CreateJoinPage,
    Guard: ProtectedRoute,
  },
  {
    path: '/dashboard/community/:id',
    Page: CommunityPage,
    Guard: ProtectedRoute,
  },
  {
    path: '/dashboard/community/:id/settings',
    Page: CommunitySettingsPage,
    Guard: ProtectedRoute,
  },
  {
    path: '/dashboard/local-group/:id',
    Page: LocalGroupPage,
    Guard: ProtectedRoute,
  },
  {
    path: '/dashboard/local-group/:id/settings',
    Page: LocalGroupSettingsPage,
    Guard: ProtectedRoute,
  },
  {
    path: '/profile/setup',
    Page: ProfileSetupPage,
    Guard: ProfileSetupRoute,
  },
  { path: '*', Page: LandingPage },
]
