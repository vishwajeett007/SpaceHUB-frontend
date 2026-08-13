import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestForgotPassword, validateOtp, resendForgotOtp } from '../../../shared/services/API';
import {
  clearPasswordResetState,
  normalizeAuthToken,
} from '../../../shared/services/authStorage';
import { showToast } from '../../../shared/services/toast';
import { SEO } from '../../../shared';
import AuthSlides from '../components/AuthSlides';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const storedResetIdentifier = sessionStorage.getItem('resetIdentifier') || '';
  const storedOtpToken = sessionStorage.getItem('resetOtpToken') || '';
  const [identifier, setIdentifier] = useState(storedResetIdentifier);
  const [otp, setOtp] = useState('');
  const [identifierError, setIdentifierError] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [invalidOtp, setInvalidOtp] = useState(false);
  const [step, setStep] = useState(storedResetIdentifier && storedOtpToken ? 'otp' : 'email');
  const [forgotToken, setForgotToken] = useState(storedOtpToken);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const requestInFlightRef = useRef(false);

  const hasEmoji = (value) => /[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}]/u.test(value || '');
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !hasEmoji(value);
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  };

  useEffect(() => {
    if (resendTimer <= 0) return undefined;

    const timeoutId = setTimeout(() => {
      setResendTimer((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (requestInFlightRef.current) return;

    if (step === 'email') {
      const identifierToSend = identifier.trim().toLowerCase();
      const emailLike = isValidEmail(identifierToSend);
      if (!emailLike) {
        setIdentifierError(true);
        if (isMobile()) {
          showToast('Enter a valid email address.', 'error');
        }
        return;
      }
      clearPasswordResetState();
      requestInFlightRef.current = true;
      setLoading(true);
      try {
        const response = await requestForgotPassword(identifierToSend);
        const token = normalizeAuthToken(
          response?.data?.tempToken || response?.data?.token || response?.tempToken || response?.token
        );
        if (!token) {
          throw new Error('The password-reset request did not return a temporary token.');
        }
        setIdentifier(identifierToSend);
        setForgotToken(token);
        sessionStorage.setItem('resetIdentifier', identifierToSend);
        sessionStorage.setItem('resetOtpToken', token);
        showToast('OTP sent!', 'success');
        setResendTimer(30);
        setStep('otp');
      } catch (err) {
        console.error('Failed to send OTP:', err.message);
        const errorMessage = err.message || 'Failed to send OTP. Please try again.';
        showToast(errorMessage, 'error');
      } finally {
        requestInFlightRef.current = false;
        setLoading(false);
      }
    } else {
      if (!/^\d{6}$/.test(otp)) {
        setOtpError(true);
        return;
      }
      setOtpError(false);
      requestInFlightRef.current = true;
      setLoading(true);
      try {
        const response = await validateOtp({
          identifier,
          otp,
          tempToken: forgotToken || sessionStorage.getItem('resetOtpToken') || '',
        });
        const token = normalizeAuthToken(
          response?.data?.accessToken || response?.accessToken || response?.data?.token || response?.token
        );
        if (!token) {
          throw new Error('OTP verification did not return a password-reset token.');
        }

        sessionStorage.setItem('resetIdentifier', identifier);
        sessionStorage.setItem('resetEmail', identifier);
        sessionStorage.setItem('resetAccessToken', token);
        sessionStorage.removeItem('resetOtpToken');
        showToast('OTP verified successfully!', 'success');
        navigate('/reset');
      } catch (err) {
        console.error('Invalid OTP:', err.message);
        const errorMessage = err.message || 'Invalid OTP. Please try again.';
        if (/invalid|otp/i.test(errorMessage)) {
          setInvalidOtp(true);
        }
        showToast(errorMessage, 'error');
      } finally {
        requestInFlightRef.current = false;
        setLoading(false);
      }
    }
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();
    if (!forgotToken || resendTimer > 0 || requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    setLoading(true);
    try {
      await resendForgotOtp(forgotToken);
      showToast('OTP resent successfully!', 'success');
      setResendTimer(30);
    } catch (err) {
      console.error('Failed to resend OTP:', err.message);
      const errorMessage = err.message || 'Failed to resend OTP. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  };

  const handleBackToEmail = (e) => {
    e.preventDefault();
    clearPasswordResetState();
    setForgotToken('');
    setStep('email');
    setOtp('');
    setInvalidOtp(false);
    setOtpError(false);
    setResendTimer(0);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setIdentifier(value);

    setIdentifierError(false);
  };

  return (
    <>
      <SEO
        title="Forgot Password"
        description="Reset your SpaceHUB account password securely."
        url="https://www.spacehubx.me/forgot-password"

      />
      <div className="w-screen h-screen flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden lg:fixed lg:top-0 lg:left-0 overflow-hidden text-body">

      <AuthSlides />

  <div className="flex-1 flex items-center justify-center p-1 lg:p-12 bg-[#EEEEEE] lg:h-full lg:min-h-screen lg:overflow-y-auto lg:rounded-l-4xl rounded-t-[2.25rem] lg:rounded-tr-none sm:rounded-t-[2.25rem] lg:-ml-4 -mt-2 lg:mt-0 relative z-10 lg:shadow-lg shadow-lg overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="text-center mb-1 lg:mb-8">
             <div className="mx-auto h-12 w-12 lg:h-40 lg:w-40 flex items-center justify-center pt-1 lg:pt-10 ">
               <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
                 <img src="/favicon.png" alt="Logo" className="h-8 w-10 lg:h-15 lg:w-22" />
               </button>
             </div>
            {step === 'email' ? (
              <>
                <h3 className="text-lg lg:text-[1.75rem] font-semibold text-default mb-0.5 lg:mb-1">Verify your account</h3>
                <p className="text-muted text-xs lg:text-[1.25rem] font-normal">Enter your email to receive OTP</p>
              </>
            ) : (
              <>
                <h3 className="text-lg lg:text-[1.75rem] font-semibold text-default mb-0.5 lg:mb-1">Enter otp</h3>
                <p className="text-muted text-xs lg:text-[1.25rem] font-normal">Verify to reset your password</p>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-1.5 lg:space-y-6">
            {step === 'email' ? (
              <div>
                <label htmlFor="email" className="flex items-center gap-2 text-base lg:text-[1.25rem] font-medium text-default mb-1 lg:mb-2 text-left">
                  Email address
                </label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M22 7.53516V17.0002C22 17.7654 21.7077 18.5017 21.1827 19.0584C20.6578 19.6152 19.9399 19.9503 19.176 19.9952L19 20.0002H5C4.23479 20.0002 3.49849 19.7078 2.94174 19.1829C2.38499 18.6579 2.04989 17.9401 2.005 17.1762L2 17.0002V7.53516L11.445 13.8322L11.561 13.8982C11.6977 13.965 11.8478 13.9997 12 13.9997C12.1522 13.9997 12.3023 13.965 12.439 13.8982L12.555 13.8322L22 7.53516Z" fill="#ADADAD"/>
                       <path d="M19 4C20.08 4 21.027 4.57 21.555 5.427L12 11.797L2.44501 5.427C2.6958 5.01982 3.0403 4.6785 3.44978 4.43149C3.85926 4.18448 4.32186 4.03894 4.79901 4.007L5.00001 4H19Z" fill="#ADADAD"/>
                     </svg>
                   </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={handleEmailChange}
                    className={`w-full pl-10 pr-4 py-2 lg:py-3 text-sm lg:text-base border-2 rounded-md ring-primary transition-colors bg-gray-50 placeholder-[#ADADAD] h-[2.2rem] lg:h-[2.75rem] max-w-[30.875rem] ${identifierError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`}
                    placeholder="Enter your email"
                    />
                  </div>
                  {identifierError && (
                    <p className="hidden lg:block mt-1 text-sm text-red-500">
                      Enter a valid email address.
                    </p>
                  )}
                </div>
            ) : (
              <div>
                <label htmlFor="otp" className="block text-base lg:text-[1.25rem] font-medium text-default mb-1 lg:mb-2 text-left">
                  Enter otp {invalidOtp && <span className="text-red-500 font-normal">(Invalid otp)</span>}
                </label>
                <div className="relative">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => {
                      const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(onlyDigits);
                      setInvalidOtp(false);
                      if (onlyDigits && onlyDigits.length !== 6) {
                        setOtpError(true);
                      } else {
                        setOtpError(false);
                      }
                    }}
                    className={`w-full px-3 lg:px-4 py-2 lg:py-3 pr-12 text-sm lg:text-base border-2 rounded-md ring-primary transition-colors bg-gray-50 placeholder-[#ADADAD] h-[2.2rem] lg:h-[2.75rem] max-w-[30.875rem] ${invalidOtp || otpError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`}
                    placeholder="Enter otp"
                  />
                  {invalidOtp && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right mt-2">
                  <a
                    href="#"
                    onClick={handleResendOtp}
                    className={`text-default underline font-medium ${
                      loading || resendTimer > 0
                        ? 'opacity-50 cursor-not-allowed pointer-events-none text-gray-500'
                        : 'hover:text-blue-700'
                    }`}
                  >
                    {loading
                      ? 'Sending...'
                      : resendTimer > 0
                        ? `Resend otp (${resendTimer}s)`
                        : 'Resend otp'
                    }
                  </a>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[2.4rem] lg:h-auto flex justify-center py-2 lg:py-3 px-4 border border-transparent rounded-md text-white btn-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-semibold text-sm lg:text-base disabled:opacity-60"
            >
              {loading ? (step === 'email' ? 'Sending...' : 'Verifying...') : (step === 'email' ? 'Send OTP' : 'Verify')}
            </button>

            <div className="text-center">
              {step === 'email' ? (
                <p className="text-sm text-black">
                  <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 underline">Back</Link>
                </p>
              ) : (
                <p className="text-sm text-black">
                  <a href="#" onClick={handleBackToEmail} className="font-semibold text-blue-600 hover:text-blue-700 underline">Back</a>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default ForgotPasswordPage;
