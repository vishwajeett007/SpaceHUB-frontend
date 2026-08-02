import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../../shared/services/API';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import {
  clearPasswordResetState,
  normalizeAuthToken,
} from '../../../shared/services/authStorage';
import { showToast } from '../../../shared/services/toast';
import { SEO } from '../../../shared';
import AuthSlides from '../components/AuthSlides';


const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (value) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[#@!%&])(?=.*[0-9])(?!.*\s).{8,}$/;
    const hasEmoji = /[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}]/u.test(value || '');
    return passwordRegex.test(value) && !hasEmoji;
  };

  const onPasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(!!value && !validatePassword(value));
    setPasswordMismatch(value && confirmPassword ? value !== confirmPassword : false);
  };

  const onConfirmChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordMismatch(password && value ? password !== value : false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passwordError && !passwordMismatch && password && confirmPassword) {
      setLoading(true);
      const identifier = sessionStorage.getItem('resetIdentifier') || sessionStorage.getItem('resetEmail') || '';
      const tempToken = sessionStorage.getItem('resetAccessToken') || '';
      resetPassword({ identifier, newPassword: password, tempToken })
        .then((data) => {
          const token = normalizeAuthToken(
            data?.accessToken || data?.token || data?.jwt || data?.data?.accessToken || data?.data?.token
          );
          const userObj = data?.user || data?.data?.user || { email: identifier };
          try {
            sessionStorage.setItem('lastIdentifier', identifier);
            sessionStorage.setItem('lastEmail', identifier);
          } catch (storageError) {
            console.warn('Unable to remember the reset-password identifier:', storageError);
          }
          clearPasswordResetState();
          showToast('Password reset successfully!', 'success');

          if (token) {
            login(userObj, token);
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        })
        .catch((err) => {
          console.error('Reset failed:', err.message);
          const errorMessage = err.message || 'Failed to reset password. Please try again.';
          showToast(errorMessage, 'error');
        })
        .finally(() => setLoading(false));
    }
  }; 

  return (
    <>
      <SEO
        title="Reset Password"
        description="Choose a new password to keep your SpaceHUB account safe."
        noindex={true}
      />
      <style>

        {`
          .password-input[type="password"]:not([data-show="true"]):not(:placeholder-shown) {
            -webkit-text-security: disc;
            text-security: disc;
            color: #3b82f6;
            font-size: 1.75rem;
            line-height: 1;
            letter-spacing: 0.2em;
            font-family: 'Arial', sans-serif;
          }
          .password-input[type="password"]:not([data-show="true"]):placeholder-shown {
            -webkit-text-security: none;
            text-security: none;
            color: #9ca3af;
            font-size: 1rem;
            line-height: normal;
            letter-spacing: normal;
            font-family: inherit;
          }
        `}
      </style>
      <div className="w-screen min-h-screen flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden lg:fixed lg:top-0 lg:left-0 overflow-x-hidden text-body">
        <AuthSlides />

  <div className="flex-1 flex items-center justify-center p-4 lg:p-12 bg-[#EEEEEE] lg:h-full lg:min-h-screen lg:overflow-y-auto lg:rounded-l-4xl rounded-t-[2.25rem] lg:rounded-tr-none sm:rounded-t-[2.25rem] lg:-ml-4 -mt-2 lg:mt-0 relative z-10 lg:shadow-lg shadow-lg">
          <div className="w-full max-w-md">
            <div className="text-center mb-6 lg:mb-8">
              <div className="mx-auto h-24 w-24 lg:h-40 lg:w-40 flex items-center justify-center pt-4 lg:pt-10 ">
                <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
                  <img src="/favicon.png" alt="Logo" className="h-12 w-16 lg:h-15 lg:w-22" />
                </button>
              </div>
              <h3 className="text-xl lg:text-[1.75rem] font-semibold text-default mb-1">Create new password</h3>
              <p className="text-muted text-sm lg:text-[1.25rem] font-normal">Choose a new pass to keep your account safe</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
              <div>
                <label htmlFor="password" className="block text-base lg:text-[1.25rem] font-medium text-default mb-1 lg:mb-2 text-left">Enter Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.616 18C1.17133 18 0.791 17.8417 0.475 17.525C0.159 17.2083 0.000666667 16.8287 0 16.386V7.616C0 7.172 0.158333 6.792 0.475 6.476C0.791667 6.16 1.17167 6.00133 1.615 6H3V4C3 2.886 3.38833 1.941 4.165 1.165C4.941 0.388333 5.886 0 7 0C8.114 0 9.05933 0.388333 9.836 1.165C10.6127 1.94167 11.0007 2.88667 11 4V6H12.385C12.829 6 13.209 6.15833 13.525 6.475C13.841 6.79167 13.9993 7.17167 14 7.615V16.385C14 16.829 13.8417 17.209 13.525 17.525C13.2083 17.841 12.8283 17.9993 12.385 18H1.616ZM7 13.5C7.422 13.5 7.77733 13.3553 8.066 13.066C8.35533 12.7773 8.5 12.422 8.5 12C8.5 11.578 8.35533 11.2227 8.066 10.934C7.77667 10.6453 7.42133 10.5007 7 10.5C6.57867 10.4993 6.22333 10.644 5.934 10.934C5.64467 11.2227 5.5 11.578 5.5 12C5.5 12.422 5.64467 12.7773 5.934 13.066C6.22267 13.3553 6.578 13.5 7 13.5ZM4 6H10V4C10 3.16667 9.70833 2.45833 9.125 1.875C8.54167 1.29167 7.83333 1 7 1C6.16667 1 5.45833 1.29167 4.875 1.875C4.29167 2.45833 4 3.16667 4 4V6Z" fill="#ADADAD"/>
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={onPasswordChange}
                    data-show={showPassword}
                    className={`password-input w-full pl-10 pr-12 py-2 lg:py-3 text-sm lg:text-base border-2 rounded-md ring-primary transition-colors bg-gray-50 placeholder-[#ADADAD] h-[2.2rem] lg:h-[2.75rem] max-w-[30.875rem] ${passwordError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`}
                    placeholder="Enter your password"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 focus:outline-none" onClick={() => setShowPassword((p)=>!p)} tabIndex={-1}>
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M2.5 8.99959C2.49963 8.63682 2.63074 8.2862 2.86905 8.01268C3.10736 7.73916 3.43673 7.56127 3.79614 7.51197C4.15555 7.46266 4.52065 7.54528 4.82381 7.74452C5.12698 7.94376 5.34767 8.24612 5.445 8.59559C7.392 15.0976 16.603 15.0986 18.554 8.60059C18.6088 8.41055 18.7007 8.23322 18.8243 8.07883C18.9479 7.92443 19.1009 7.796 19.2743 7.70094C19.4478 7.60588 19.6383 7.54607 19.835 7.52494C20.0317 7.50381 20.2305 7.52178 20.4202 7.57783C20.6099 7.63387 20.7867 7.72687 20.9403 7.85149C21.0939 7.9761 21.2213 8.12986 21.3152 8.30392C21.4092 8.47798 21.4678 8.6689 21.4876 8.8657C21.5075 9.06249 21.4883 9.26127 21.431 9.45059C21.0893 10.6182 20.5395 11.7145 19.808 12.6866L20.768 13.6466C20.9112 13.785 21.0254 13.9506 21.1039 14.1336C21.1824 14.3167 21.2237 14.5135 21.2254 14.7127C21.227 14.9119 21.189 15.1094 21.1134 15.2937C21.0379 15.478 20.9265 15.6454 20.7856 15.7862C20.6447 15.927 20.4771 16.0383 20.2928 16.1136C20.1084 16.1889 19.9108 16.2268 19.7117 16.225C19.5125 16.2231 19.3157 16.1817 19.1327 16.103C18.9498 16.0243 18.7843 15.9099 18.646 15.7666L17.636 14.7566C17.111 15.1162 16.5516 15.4227 15.966 15.6716L16.209 16.5776C16.3012 16.9582 16.2409 17.3597 16.041 17.6964C15.8411 18.0331 15.5175 18.2783 15.1393 18.3796C14.761 18.4809 14.3582 18.4303 14.0167 18.2386C13.6753 18.0469 13.4224 17.7293 13.312 17.3536L13.061 16.4186C12.356 16.4916 11.644 16.4916 10.939 16.4186L10.689 17.3536C10.5861 17.7379 10.3347 18.0656 9.99024 18.2645C9.64574 18.4635 9.2363 18.5175 8.852 18.4146C8.4677 18.3117 8.14002 18.0603 7.94105 17.7158C7.74207 17.3713 7.6881 16.9619 7.791 16.5776L8.033 15.6706C7.44777 15.4219 6.88869 15.1158 6.364 14.7566L5.354 15.7666C5.2157 15.9099 5.05023 16.0243 4.86727 16.103C4.6843 16.1817 4.48749 16.2231 4.28832 16.225C4.08915 16.2268 3.89162 16.1889 3.70724 16.1136C3.52286 16.0383 3.35533 15.927 3.21442 15.7862C3.07352 15.6454 2.96206 15.478 2.88655 15.2937C2.81104 15.1094 2.773 14.9119 2.77463 14.7127C2.77627 14.5135 2.81756 14.3167 2.89608 14.1336C2.97461 13.9506 3.0888 13.785 3.232 13.6466L4.192 12.6866C3.46223 11.7161 2.91344 10.6219 2.572 9.45659C2.52451 9.3089 2.50022 9.15473 2.5 8.99959Z" fill="#176CBF" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9C11.2044 9 10.4413 9.31607 9.87868 9.87868C9.31607 10.4413 9 11.2044 9 12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12C15 11.2044 14.6839 10.4413 14.1213 9.87868C13.5587 9.31607 12.7956 9 12 9ZM12 17C10.6739 17 9.40215 16.4732 8.46447 15.5355C7.52678 14.5979 7 13.3261 7 12C7 10.6739 7.52678 9.40215 8.46447 8.46447C9.40215 7.52678 10.6739 7 12 7C13.3261 7 14.5979 7.52678 15.5355 8.46447C16.4732 9.40215 17 10.6739 17 12C17 13.3261 16.4732 14.5979 15.5355 15.5355C14.5979 16.4732 13.3261 17 12 17ZM12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z" fill="#ADADAD"/>
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-sm">
                    <p className="text-xs text-blue-600 font-medium mb-1">Password Requirements :
                      <span className="text-xs text-blue-500">Password must be at least 8 characters, with a number, with one uppercase letter and one special character (#, @, !, %, &).</span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-base lg:text-[1.25rem] font-medium text-default mb-1 lg:mb-2 text-left">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.616 18C1.17133 18 0.791 17.8417 0.475 17.525C0.159 17.2083 0.000666667 16.8287 0 16.386V7.616C0 7.172 0.158333 6.792 0.475 6.476C0.791667 6.16 1.17167 6.00133 1.615 6H3V4C3 2.886 3.38833 1.941 4.165 1.165C4.941 0.388333 5.886 0 7 0C8.114 0 9.05933 0.388333 9.836 1.165C10.6127 1.94167 11.0007 2.88667 11 4V6H12.385C12.829 6 13.209 6.15833 13.525 6.475C13.841 6.79167 13.9993 7.17167 14 7.615V16.385C14 16.829 13.8417 17.209 13.525 17.525C13.2083 17.841 12.8283 17.9993 12.385 18H1.616ZM7 13.5C7.422 13.5 7.77733 13.3553 8.066 13.066C8.35533 12.7773 8.5 12.422 8.5 12C8.5 11.578 8.35533 11.2227 8.066 10.934C7.77667 10.6453 7.42133 10.5007 7 10.5C6.57867 10.4993 6.22333 10.644 5.934 10.934C5.64467 11.2227 5.5 11.578 5.5 12C5.5 12.422 5.64467 12.7773 5.934 13.066C6.22267 13.3553 6.578 13.5 7 13.5ZM4 6H10V4C10 3.16667 9.70833 2.45833 9.125 1.875C8.54167 1.29167 7.83333 1 7 1C6.16667 1 5.45833 1.29167 4.875 1.875C4.29167 2.45833 4 3.16667 4 4V6Z" fill="#ADADAD"/>
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={onConfirmChange}
                    data-show={showConfirmPassword}
                    className={`password-input w-full pl-10 pr-12 py-2 lg:py-3 text-sm lg:text-base border-2 rounded-md ring-primary transition-colors bg-gray-50 placeholder-[#ADADAD] h-[2.2rem] lg:h-[2.75rem] max-w-[30.875rem] ${passwordMismatch ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`}
                    placeholder="Re-enter your password"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 focus:outline-none" onClick={() => setShowConfirmPassword((p)=>!p)} tabIndex={-1}>
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M2.5 8.99959C2.49963 8.63682 2.63074 8.2862 2.86905 8.01268C3.10736 7.73916 3.43673 7.56127 3.79614 7.51197C4.15555 7.46266 4.52065 7.54528 4.82381 7.74452C5.12698 7.94376 5.34767 8.24612 5.445 8.59559C7.392 15.0976 16.603 15.0986 18.554 8.60059C18.6088 8.41055 18.7007 8.23322 18.8243 8.07883C18.9479 7.92443 19.1009 7.796 19.2743 7.70094C19.4478 7.60588 19.6383 7.54607 19.835 7.52494C20.0317 7.50381 20.2305 7.52178 20.4202 7.57783C20.6099 7.63387 20.7867 7.72687 20.9403 7.85149C21.0939 7.9761 21.2213 8.12986 21.3152 8.30392C21.4092 8.47798 21.4678 8.6689 21.4876 8.8657C21.5075 9.06249 21.4883 9.26127 21.431 9.45059C21.0893 10.6182 20.5395 11.7145 19.808 12.6866L20.768 13.6466C20.9112 13.785 21.0254 13.9506 21.1039 14.1336C21.1824 14.3167 21.2237 14.5135 21.2254 14.7127C21.227 14.9119 21.189 15.1094 21.1134 15.2937C21.0379 15.478 20.9265 15.6454 20.7856 15.7862C20.6447 15.927 20.4771 16.0383 20.2928 16.1136C20.1084 16.1889 19.9108 16.2268 19.7117 16.225C19.5125 16.2231 19.3157 16.1817 19.1327 16.103C18.9498 16.0243 18.7843 15.9099 18.646 15.7666L17.636 14.7566C17.111 15.1162 16.5516 15.4227 15.966 15.6716L16.209 16.5776C16.3012 16.9582 16.2409 17.3597 16.041 17.6964C15.8411 18.0331 15.5175 18.2783 15.1393 18.3796C14.761 18.4809 14.3582 18.4303 14.0167 18.2386C13.6753 18.0469 13.4224 17.7293 13.312 17.3536L13.061 16.4186C12.356 16.4916 11.644 16.4916 10.939 16.4186L10.689 17.3536C10.5861 17.7379 10.3347 18.0656 9.99024 18.2645C9.64574 18.4635 9.2363 18.5175 8.852 18.4146C8.4677 18.3117 8.14002 18.0603 7.94105 17.7158C7.74207 17.3713 7.6881 16.9619 7.791 16.5776L8.033 15.6706C7.44777 15.4219 6.88869 15.1158 6.364 14.7566L5.354 15.7666C5.2157 15.9099 5.05023 16.0243 4.86727 16.103C4.6843 16.1817 4.48749 16.2231 4.28832 16.225C4.08915 16.2268 3.89162 16.1889 3.70724 16.1136C3.52286 16.0383 3.35533 15.927 3.21442 15.7862C3.07352 15.6454 2.96206 15.478 2.88655 15.2937C2.81104 15.1094 2.773 14.9119 2.77463 14.7127C2.77627 14.5135 2.81756 14.3167 2.89608 14.1336C2.97461 13.9506 3.0888 13.785 3.232 13.6466L4.192 12.6866C3.46223 11.7161 2.91344 10.6219 2.572 9.45659C2.52451 9.3089 2.50022 9.15473 2.5 8.99959Z" fill="#176CBF" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9C11.2044 9 10.4413 9.31607 9.87868 9.87868C9.31607 10.4413 9 11.2044 9 12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12C15 11.2044 14.6839 10.4413 14.1213 9.87868C13.5587 9.31607 12.7956 9 12 9ZM12 17C10.6739 17 9.40215 16.4732 8.46447 15.5355C7.52678 14.5979 7 13.3261 7 12C7 10.6739 7.52678 9.40215 8.46447 8.46447C9.40215 7.52678 10.6739 7 12 7C13.3261 7 14.5979 7.52678 15.5355 8.46447C16.4732 9.40215 17 10.6739 17 12C17 13.3261 16.4732 14.5979 15.5355 15.5355C14.5979 16.4732 13.3261 17 12 17ZM12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z" fill="#ADADAD"/>
                      </svg>
                    )}
                  </button>
                </div>
                {passwordMismatch && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-sm">
                    <p className="text-xs text-blue-600 font-medium">Passwords do not match.</p>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className="w-full h-[2.4rem] lg:h-auto flex justify-center py-2 lg:py-3 px-4 border border-transparent rounded-md text-white btn-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-semibold text-sm lg:text-base disabled:opacity-60">
                {loading ? 'Creating...' : 'Create'}
              </button>

              <div className="text-center">
                <p className="text-sm text-black">
                  <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 underline">Back to login</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
