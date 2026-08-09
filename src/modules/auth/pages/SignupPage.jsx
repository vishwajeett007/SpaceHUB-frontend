import React, { useState, useRef, useEffect } from 'react';
import { registerUser, validateRegisterOtp, resendRegisterOtp } from '../../../shared/services/API';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { showToast } from '../../../shared/services/toast';
import { SEO } from '../../../shared';
import AuthSlides from '../components/AuthSlides';


const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [step, setStep] = useState(1);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [invalidOtp, setInvalidOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationToken, setRegistrationToken] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const debounceRefs = useRef({});
  const throttleRefs = useRef({ requestOtp: 0, verifyOtp: 0, resendOtp: 0 });
  const timerIntervalRef = useRef(null);

  const runDebounced = (key, fn, delay = 300) => {
    if (debounceRefs.current[key]) {
      clearTimeout(debounceRefs.current[key]);
    }
    debounceRefs.current[key] = setTimeout(fn, delay);
  };

  const shouldThrottleAction = (key, delay = 2000, message) => {
    const now = Date.now();
    const last = throttleRefs.current[key] || 0;
    if (now - last < delay) {
      showToast(message || 'Please wait before trying again.', 'info');
      return true;
    }
    throttleRefs.current[key] = now;
    return false;
  };

  useEffect(() => {
    const debounceTimers = debounceRefs.current;
    return () => {
      Object.values(debounceTimers).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (location.state?.step === 3 || sessionStorage.getItem('pendingVerificationEmail')) {
      const emailToVerify = location.state?.email || sessionStorage.getItem('pendingVerificationEmail') || sessionStorage.getItem('signupEmail');
      const token = location.state?.token || sessionStorage.getItem('registrationToken');
      if (emailToVerify) {
        setFormData((prev) => ({ ...prev, email: emailToVerify }));
        if (token) setRegistrationToken(token);
        setStep(3);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (resendTimer > 0) {
      timerIntervalRef.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [resendTimer]);

  const hasEmoji = (value) => /[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}]/u.test(value || '');
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !hasEmoji(value);

  const validateName = (name, trimmedValue) => {
    if (name && trimmedValue.length === 0) {
      return true;
    } else if (name && trimmedValue.length < 2) {
      return true;
    } else if (name && trimmedValue.length > 50) {
      return true;
    } else if (name && !/^[A-Za-z]+$/.test(trimmedValue)) {
      return true;
    }
    return false;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'firstName' || name === 'lastName') {
      const cleanValue = value.replace(/[^A-Za-z]/g, '');
      const limitedValue = cleanValue.slice(0, 50);

      setFormData((prev) => ({
        ...prev,
        [name]: limitedValue
      }));

      const trimmedValue = limitedValue.trim();
      const hasError = validateName(limitedValue, trimmedValue);
      if (name === 'firstName') {
        setFirstNameError(hasError);
      } else {
        setLastNameError(hasError);
      }
      return;
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'password' || name === 'confirmPassword') {

        const nextPassword = name === 'password' ? value : updated.password;
        const nextConfirm = name === 'confirmPassword' ? value : updated.confirmPassword;


        if (nextPassword && nextConfirm) {
          const doNotMatch = nextPassword !== nextConfirm;

          if (confirmPasswordBlurred) {
            setPasswordMismatch(doNotMatch);
          } else {

            setPasswordMismatch(false);
          }
        } else {

          setPasswordMismatch(false);
        }
      }

      return updated;
    });

    if (name === 'email') {

      setEmailError(false);
    }

    if (name === 'password') {
      setPasswordError(false);
      runDebounced('password', () => {
        const passwordRegex = /^(?=.*[A-Z])(?=.*[#@!%&])(?=.*[0-9])(?!.*\s).{8,}$/;
        setPasswordError(Boolean(value) && (!passwordRegex.test(value) || hasEmoji(value)));
      });
    }
  };

  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  };

  const handleEmailBlur = (e) => {
    const emailValue = e.target.value;

    if (emailValue) {
      const hasError = !isValidEmail(emailValue);
      setEmailError(hasError);
      if (hasError && isMobile()) {
        showToast('Email Requirements: Must be a valid email address, must contain @ symbol and a domain name.', 'error');
      }
    } else {
      setEmailError(false);
    }
  };

  const handleStepOneSubmit = (e) => {
    e.preventDefault();

    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();

    const isFirstNameValid = !validateName(formData.firstName, trimmedFirstName);
    const isLastNameValid = !validateName(formData.lastName, trimmedLastName);

    setFirstNameError(!isFirstNameValid);
    setLastNameError(!isLastNameValid);

    setFormData({
      ...formData,
      firstName: trimmedFirstName,
      lastName: trimmedLastName
    });

    if (isFirstNameValid && isLastNameValid) {
      setStep(2);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordBlurred, setConfirmPasswordBlurred] = useState(false);

  const handleRequestOtpAndNext = (e) => {
    e.preventDefault();
    let hasEmailError = false;
    if (formData.email) {
      const isEmailValid = isValidEmail(formData.email);
      hasEmailError = !isEmailValid;
      setEmailError(hasEmailError);
      if (hasEmailError) {
        if (isMobile()) {
          showToast('Email Requirements: Must be a valid email address, must contain @ symbol and a domain name.', 'error');
        }
        return;
      }
    }

    if (passwordError) {
      if (isMobile()) {
        showToast('Password Requirements: Password must be at least 8 characters, with one uppercase letter, with a number and one special character (#, @, !, %, &).', 'error');
      }
      return;
    }
    if (passwordMismatch) {
      if (isMobile()) {
        showToast('Passwords do not match.', 'error');
      }
      return;
    }
    if (hasEmoji(formData.email) || hasEmoji(formData.password)) {
      if (isMobile()) {
        showToast('Emojis are not allowed in email or password fields.', 'error');
      }
      return;
    }
    if (!formData.email || !formData.password) {
      return;
    }
    if (shouldThrottleAction('requestOtp', 2500, 'Please wait a moment before requesting another OTP.')) {
      return;
    }
    setLoading(true);
    const { firstName, lastName, email, password } = formData;
    const payload = { firstName, lastName, email, password };
    registerUser(payload)
      .then((res) => {
        const token = (res && res.data) ? (res.data.token || res.data) : '';
        setRegistrationToken(token);

        if (token && typeof token === 'string') {
          sessionStorage.setItem('registrationToken', token);
        }

        sessionStorage.setItem('signupEmail', email);
        sessionStorage.setItem('signupFirstName', firstName);
        sessionStorage.setItem('signupLastName', lastName);

        showToast('OTP sent to your email!', 'success');
        setResendTimer(30);
        setStep(3);
      })
      .catch((err) => {
        console.error('Failed to initiate registration/OTP:', err.message);
        const errorMessage = err.message || 'Failed to send OTP. Please try again.';

        // Handle existing email scenario by redirecting user to Login page with auto-filled email
        if (errorMessage.toLowerCase().includes('already registered') || errorMessage.toLowerCase().includes('already exists') || err.status === 409) {
          sessionStorage.setItem('lastIdentifier', email);
          showToast('Email is already registered. Redirecting to login...', 'info');
          setTimeout(() => {
            navigate('/login', { state: { autoFillEmail: email } });
          }, 1200);
          return;
        }

        showToast(errorMessage, 'error');
      })
      .finally(() => setLoading(false));
  };

  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    const onlyDigits = otp.replace(/\D/g, '');
    if (!/^\d{6}$/.test(onlyDigits)) {
      setOtpError(true);
      return;
    }
    if (shouldThrottleAction('verifyOtp', 2000, 'Please wait a moment before submitting again.')) {
      return;
    }
    setOtpError(false);
    setLoading(true);
    setInvalidOtp(false);
    try {
      await validateRegisterOtp({
        identifier: formData.email,
        otp: onlyDigits,
        type: 'REGISTRATION',
        sessionToken: registrationToken || sessionStorage.getItem('registrationToken') || ''
      });
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('userData');
      try {
        sessionStorage.setItem('lastIdentifier', formData.email);
        sessionStorage.setItem('lastEmail', formData.email);
      } catch (storageError) {
        console.warn('Unable to remember the new account identifier:', storageError);
      }

      sessionStorage.removeItem('registrationToken');
      sessionStorage.removeItem('signupEmail');
      sessionStorage.removeItem('signupFirstName');
      sessionStorage.removeItem('signupLastName');
      sessionStorage.removeItem('pendingVerificationEmail');

      localStorage.setItem('profileSetupRequired', 'true');
      showToast('Account created successfully! Please log in to complete your profile setup.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('OTP verification failed:', err.message);
      const errorMessage = err.message || 'Verification failed. Please try again.';
      if (err.message.includes('Invalid') || err.message.includes('invalid') || err.message.includes('OTP')) {
        setInvalidOtp(true);
      }
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = (e) => {
    e.preventDefault();
    if (!formData.email || resendTimer > 0) return;
    setLoading(true);
    resendRegisterOtp(formData.email, registrationToken)
      .then(() => {
        showToast('OTP resent successfully!', 'success');
        setResendTimer(30);
      })
      .catch((err) => {
        console.error('Failed to resend OTP:', err.message);
        const errorMessage = err.message || 'Failed to resend OTP. Please try again.';
        showToast(errorMessage, 'error');
      })
      .finally(() => setLoading(false));
  };

  const handleBackToStepOne = (e) => {
    e.preventDefault();
    setStep(1);
    setOtp('');
    setInvalidOtp(false);
    setOtpError(false);
    setResendTimer(0);
  };

  return (
    <>
      <SEO
        title="Sign Up"
        description="Create your SpaceHUB account today. Join thousands of teams collaborating with real-time chat, voice channels, and shared workspaces."
        keywords="SpaceHUB signup, register account, create workspace, team registration"
        url="https://www.spacehubx.me/signup"
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
      <div className="w-screen h-screen flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden lg:fixed lg:top-0 lg:left-0 overflow-hidden text-body bg-white lg:bg-blue-200/90">
        <AuthSlides />

        <div
          className="flex-1 flex items-start lg:items-center justify-center p-0 lg:p-12 bg-[#EEEEEE] lg:h-full lg:min-h-screen lg:overflow-y-auto lg:rounded-l-4xl rounded-t-[2.25rem] lg:rounded-tr-none sm:rounded-t-[2.25rem] lg:-ml-4 -mt-2 lg:mt-0 relative z-10 lg:shadow-lg shadow-lg overflow-y-auto"
        >
          <div className="w-full max-w-[32rem] mb-4 lg:mb-5 py-2 lg:py-0 px-2 lg:px-0">
            <div className="text-center mb-3 lg:mb-17">
              <div className="mx-auto h-14 w-14 lg:h-40 lg:w-40 flex items-center justify-center pt-2 lg:pt-25 ">
                <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
                  <img src="/favicon.png" alt="Logo" className="h-9 w-12 lg:h-17 lg:w-24" />
                </button>
              </div>

              {step === 3 ? (
                <>
                  <h3 className="text-lg lg:text-[1.75rem] font-medium text-default mb-0.5 lg:mb-2">Verify your Email</h3>
                  <p className="text-muted text-xs lg:text-[1.25rem] font-body">
                    Please verify your email to activate your account
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg lg:text-[1.75rem] font-medium text-default mb-0.5 lg:mb-2">Signup to your account</h3>
                  <p className="text-muted text-xs lg:text-[1.25rem] font-body">
                    Create your account to start collaborating.
                  </p>
                </>
              )}

            </div>
            {step === 1 ? (
              <form className="space-y-3 lg:space-y-6" onSubmit={handleStepOneSubmit}>
                <div className="m-0 p-0">
                  <label htmlFor="firstName" className="block text-base lg:text-[1.25rem] font-medium text-default mb-1 lg:mb-2 text-left">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-3 lg:px-4 text-sm lg:text-base border rounded-md ring-primary focus:border-blue-500 transition-colors placeholder-[#ADADAD] h-[2.2rem] lg:h-[2.6rem] max-w-[32rem] ${firstNameError ? 'border-red-500 bg-red-50' : 'border-gray-400'
                      }`}
                    placeholder="Enter first name"
                  />
                  <div className="flex justify-between items-center mt-1">
                    {firstNameError && (
                      <p className="text-red-500 text-sm">
                        {formData.firstName.trim().length === 0
                          ? "First name is required"
                          : formData.firstName.trim().length < 2
                            ? "First name must be at least 2 characters long"
                            : formData.firstName.trim().length > 50
                              ? "First name cannot exceed 50 characters"
                              : "First name can only contain letters (no spaces)"
                        }
                      </p>
                    )}
                    <p className={`text-xs ml-auto ${formData.firstName.length > 40 ? 'text-orange-500' :
                      formData.firstName.length > 30 ? 'text-yellow-500' :
                        'text-gray-400'
                      }`}>
                      {formData.firstName.length}/50
                    </p>
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-base lg:text-[1.25rem] font-medium text-default mb-1 lg:mb-2 text-left">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-3 lg:px-4 text-sm lg:text-base border rounded-md ring-primary focus:border-blue-500 transition-colors placeholder-[#ADADAD] h-[2.2rem] lg:h-[2.75rem] max-w-[32rem] ${lastNameError ? 'border-red-500 bg-red-50' : 'border-gray-400'
                      }`}
                    placeholder="Enter last name"
                  />
                  <div className="flex justify-between items-center mt-1">
                    {lastNameError && (
                      <p className="text-red-500 text-sm">
                        {formData.lastName.trim().length === 0
                          ? "Last name is required"
                          : formData.lastName.trim().length < 2
                            ? "Last name must be at least 2 characters long"
                            : formData.lastName.trim().length > 50
                              ? "Last name cannot exceed 50 characters"
                              : "Last name can only contain letters (no spaces)"
                        }
                      </p>
                    )}
                    <p className={`text-xs ml-auto ${formData.lastName.length > 40 ? 'text-orange-500' :
                      formData.lastName.length > 30 ? 'text-yellow-500' :
                        'text-gray-400'
                      }`}>
                      {formData.lastName.length}/50
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || firstNameError || lastNameError || !formData.firstName.trim() || !formData.lastName.trim()}
                  className="w-full h-[2.4rem] lg:h-[2.8rem] flex justify-center px-4 pt-1 border border-transparent rounded-md text-white btn-primary bg-[#176CBF] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 text-base lg:text-[1.36rem] gap-[0.645rem] disabled:opacity-60"
                >
                  {loading ? 'Loading...' : 'Continue'}
                </button>
                <div className="text-center mb-2">
                  <p className="text-md text-zinc-700">
                    <span className="font-semibold ">Have an account?</span>{' '}
                    <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 underline">
                      Login
                    </Link>
                  </p>
                </div>
              </form>
            ) : step === 2 ? (
              <form className="space-y-3 lg:space-y-6" onSubmit={handleRequestOtpAndNext}>
                <div>
                  <label htmlFor="email" className="flex items-center gap-2 text-base lg:text-[1.25rem] font-medium text-default mb-1 lg:mb-2 text-left">
                    Enter email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 7.53516V17.0002C22 17.7654 21.7077 18.5017 21.1827 19.0584C20.6578 19.6152 19.9399 19.9503 19.176 19.9952L19 20.0002H5C4.23479 20.0002 3.49849 19.7078 2.94174 19.1829C2.38499 18.6579 2.04989 17.9401 2.005 17.1762L2 17.0002V7.53516L11.445 13.8322L11.561 13.8982C11.6977 13.965 11.8478 13.9997 12 13.9997C12.1522 13.9997 12.3023 13.965 12.439 13.8982L12.555 13.8322L22 7.53516Z" fill="#ADADAD" />
                        <path d="M19 4C20.08 4 21.027 4.57 21.555 5.427L12 11.797L2.44501 5.427C2.6958 5.01982 3.0403 4.6785 3.44978 4.43149C3.85926 4.18448 4.32186 4.03894 4.79901 4.007L5.00001 4H19Z" fill="#ADADAD" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleEmailBlur}
                      className={`w-full pl-10 py-2 lg:py-3 text-sm lg:text-base border-2 rounded-md ring-primary transition-colors bg-gray-50 placeholder-[#ADADAD] h-[2.2rem] lg:h-[2.75rem] max-w-[33rem] ${emailError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {emailError && (
                    <div className="hidden lg:block mt-2 p-2 bg-blue-50 border border-blue-200 rounded-sm">
                      <p className="text-xs text-blue-600 font-medium mb-1">Email Requirements :
                        <span className="text-xs text-blue-500 space-y-0.5">
                          Must be a valid email address, must contain @ symbol and a domain name.
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="flex items-center gap-2 text-base lg:text-[1.25rem] font-medium text-default mb-1 lg:mb-2 text-left">
                    Enter Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg width="20" height="20" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.616 18C1.17133 18 0.791 17.8417 0.475 17.525C0.159 17.2083 0.000666667 16.8287 0 16.386V7.616C0 7.172 0.158333 6.792 0.475 6.476C0.791667 6.16 1.17167 6.00133 1.615 6H3V4C3 2.886 3.38833 1.941 4.165 1.165C4.941 0.388333 5.886 0 7 0C8.114 0 9.05933 0.388333 9.836 1.165C10.6127 1.94167 11.0007 2.88667 11 4V6H12.385C12.829 6 13.209 6.15833 13.525 6.475C13.841 6.79167 13.9993 7.17167 14 7.615V16.385C14 16.829 13.8417 17.209 13.525 17.525C13.2083 17.841 12.8283 17.9993 12.385 18H1.616ZM7 13.5C7.422 13.5 7.77733 13.3553 8.066 13.066C8.35533 12.7773 8.5 12.422 8.5 12C8.5 11.578 8.35533 11.2227 8.066 10.934C7.77667 10.6453 7.42133 10.5007 7 10.5C6.57867 10.4993 6.22333 10.644 5.934 10.934C5.64467 11.2227 5.5 11.578 5.5 12C5.5 12.422 5.64467 12.7773 5.934 13.066C6.22267 13.3553 6.578 13.5 7 13.5ZM4 6H10V4C10 3.16667 9.70833 2.45833 9.125 1.875C8.54167 1.29167 7.83333 1 7 1C6.16667 1 5.45833 1.29167 4.875 1.875C4.29167 2.45833 4 3.16667 4 4V6Z" fill="#ADADAD" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      data-show={showPassword}
                      className={`password-input w-full pl-10 pr-12 py-2 lg:py-3 text-sm lg:text-base border-2 rounded-md ring-primary transition-colors bg-gray-50 placeholder-[#ADADAD] h-[2.2rem] lg:h-[2.75rem] max-w-[33rem] ${passwordError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 focus:outline-none"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M2.5 8.99959C2.49963 8.63682 2.63074 8.2862 2.86905 8.01268C3.10736 7.73916 3.43673 7.56127 3.79614 7.51197C4.15555 7.46266 4.52065 7.54528 4.82381 7.74452C5.12698 7.94376 5.34767 8.24612 5.445 8.59559C7.392 15.0976 16.603 15.0986 18.554 8.60059C18.6088 8.41055 18.7007 8.23322 18.8243 8.07883C18.9479 7.92443 19.1009 7.796 19.2743 7.70094C19.4478 7.60588 19.6383 7.54607 19.835 7.52494C20.0317 7.50381 20.2305 7.52178 20.4202 7.57783C20.6099 7.63387 20.7867 7.72687 20.9403 7.85149C21.0939 7.9761 21.2213 8.12986 21.3152 8.30392C21.4092 8.47798 21.4678 8.6689 21.4876 8.8657C21.5075 9.06249 21.4883 9.26127 21.431 9.45059C21.0893 10.6182 20.5395 11.7145 19.808 12.6866L20.768 13.6466C20.9112 13.785 21.0254 13.9506 21.1039 14.1336C21.1824 14.3167 21.2237 14.5135 21.2254 14.7127C21.227 14.9119 21.189 15.1094 21.1134 15.2937C21.0379 15.478 20.9265 15.6454 20.7856 15.7862C20.6447 15.927 20.4771 16.0383 20.2928 16.1136C20.1084 16.1889 19.9108 16.2268 19.7117 16.225C19.5125 16.2231 19.3157 16.1817 19.1327 16.103C18.9498 16.0243 18.7843 15.9099 18.646 15.7666L17.636 14.7566C17.111 15.1162 16.5516 15.4227 15.966 15.6716L16.209 16.5776C16.3012 16.9582 16.2409 17.3597 16.041 17.6964C15.8411 18.0331 15.5175 18.2783 15.1393 18.3796C14.761 18.4809 14.3582 18.4303 14.0167 18.2386C13.6753 18.0469 13.4224 17.7293 13.312 17.3536L13.061 16.4186C12.356 16.4916 11.644 16.4916 10.939 16.4186L10.689 17.3536C10.5861 17.7379 10.3347 18.0656 9.99024 18.2645C9.64574 18.4635 9.2363 18.5175 8.852 18.4146C8.4677 18.3117 8.14002 18.0603 7.94105 17.7158C7.74207 17.3713 7.6881 16.9619 7.791 16.5776L8.033 15.6706C7.44777 15.4219 6.88869 15.1158 6.364 14.7566L5.354 15.7666C5.2157 15.9099 5.05023 16.0243 4.86727 16.103C4.6843 16.1817 4.48749 16.2231 4.28832 16.225C4.08915 16.2268 3.89162 16.1889 3.70724 16.1136C3.52286 16.0383 3.35533 15.927 3.21442 15.7862C3.07352 15.6454 2.96206 15.478 2.88655 15.2937C2.81104 15.1094 2.773 14.9119 2.77463 14.7127C2.77627 14.5135 2.81756 14.3167 2.89608 14.1336C2.97461 13.9506 3.0888 13.785 3.232 13.6466L4.192 12.6866C3.46223 11.7161 2.91344 10.6219 2.572 9.45659C2.52451 9.3089 2.50022 9.15473 2.5 8.99959Z" fill="#176CBF" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 9C11.2044 9 10.4413 9.31607 9.87868 9.87868C9.31607 10.4413 9 11.2044 9 12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12C15 11.2044 14.6839 10.4413 14.1213 9.87868C13.5587 9.31607 12.7956 9 12 9ZM12 17C10.6739 17 9.40215 16.4732 8.46447 15.5355C7.52678 14.5979 7 13.3261 7 12C7 10.6739 7.52678 9.40215 8.46447 8.46447C9.40215 7.52678 10.6739 7 12 7C13.3261 7 14.5979 7.52678 15.5355 8.46447C16.4732 9.40215 17 10.6739 17 12C17 13.3261 16.4732 14.5979 15.5355 15.5355C14.5979 16.4732 13.3261 17 12 17ZM12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z" fill="#ADADAD" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <>
                      {(passwordFocused || formData.password) && (
                        <div className="lg:hidden mt-2 p-2 bg-blue-50 border border-blue-200 rounded-sm">
                          <p className="text-xs text-blue-600 font-medium mb-1">Password Requirements :
                            <span className="text-xs text-blue-500">Password must be at least 8 characters, with one uppercase letter, with a number and one special character (#, @, !, %, &).</span>
                          </p>
                        </div>
                      )}
                      <div className="hidden lg:block mt-2 p-2 bg-blue-50 border border-blue-200 rounded-sm">
                        <p className="text-xs text-blue-600 font-medium mb-1">Password Requirements :
                          <span className="text-xs text-blue-500">Password must be at least 8 characters, with one uppercase letter, with a number and one special character (#, @, !, %, &).</span>
                        </p>
                      </div>
                    </>
                  )}
                </div>


                <div>
                  <label htmlFor="confirmPassword" className="block text-base lg:text-[1.25rem] font-medium text-default mb-1 lg:mb-2 text-left">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg width="20" height="20" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.616 18C1.17133 18 0.791 17.8417 0.475 17.525C0.159 17.2083 0.000666667 16.8287 0 16.386V7.616C0 7.172 0.158333 6.792 0.475 6.476C0.791667 6.16 1.17167 6.00133 1.615 6H3V4C3 2.886 3.38833 1.941 4.165 1.165C4.941 0.388333 5.886 0 7 0C8.114 0 9.05933 0.388333 9.836 1.165C10.6127 1.94167 11.0007 2.88667 11 4V6H12.385C12.829 6 13.209 6.15833 13.525 6.475C13.841 6.79167 13.9993 7.17167 14 7.615V16.385C14 16.829 13.8417 17.209 13.525 17.525C13.2083 17.841 12.8283 17.9993 12.385 18H1.616ZM7 13.5C7.422 13.5 7.77733 13.3553 8.066 13.066C8.35533 12.7773 8.5 12.422 8.5 12C8.5 11.578 8.35533 11.2227 8.066 10.934C7.77667 10.6453 7.42133 10.5007 7 10.5C6.57867 10.4993 6.22333 10.644 5.934 10.934C5.64467 11.2227 5.5 11.578 5.5 12C5.5 12.422 5.64467 12.7773 5.934 13.066C6.22267 13.3553 6.578 13.5 7 13.5ZM4 6H10V4C10 3.16667 9.70833 2.45833 9.125 1.875C8.54167 1.29167 7.83333 1 7 1C6.16667 1 5.45833 1.29167 4.875 1.875C4.29167 2.45833 4 3.16667 4 4V6Z" fill="#ADADAD" />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={(e) => {
                        setConfirmPasswordBlurred(true);
                        const currentPassword = formData.password;
                        const currentConfirm = e.target.value || formData.confirmPassword;
                        if (currentPassword && currentConfirm) {
                          setPasswordMismatch(currentPassword !== currentConfirm);
                        } else {
                          setPasswordMismatch(false);
                        }
                      }}
                      data-show={showConfirmPassword}
                      className={`password-input w-full pl-10 pr-12 py-2 lg:py-3 text-sm lg:text-base border-2 rounded-md ring-primary transition-colors bg-gray-50 placeholder-[#ADADAD] h-[2.2rem] lg:h-[2.75rem] max-w-[33rem] ${passwordMismatch && confirmPasswordBlurred ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`}
                      placeholder="Confirm your password"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowConfirmPassword(!showConfirmPassword);
                        }}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                      >
                        {showConfirmPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M2.5 8.99959C2.49963 8.63682 2.63074 8.2862 2.86905 8.01268C3.10736 7.73916 3.43673 7.56127 3.79614 7.51197C4.15555 7.46266 4.52065 7.54528 4.82381 7.74452C5.12698 7.94376 5.34767 8.24612 5.445 8.59559C7.392 15.0976 16.603 15.0986 18.554 8.60059C18.6088 8.41055 18.7007 8.23322 18.8243 8.07883C18.9479 7.92443 19.1009 7.796 19.2743 7.70094C19.4478 7.60588 19.6383 7.54607 19.835 7.52494C20.0317 7.50381 20.2305 7.52178 20.4202 7.57783C20.6099 7.63387 20.7867 7.72687 20.9403 7.85149C21.0939 7.9761 21.2213 8.12986 21.3152 8.30392C21.4092 8.47798 21.4678 8.6689 21.4876 8.8657C21.5075 9.06249 21.4883 9.26127 21.431 9.45059C21.0893 10.6182 20.5395 11.7145 19.808 12.6866L20.768 13.6466C20.9112 13.785 21.0254 13.9506 21.1039 14.1336C21.1824 14.3167 21.2237 14.5135 21.2254 14.7127C21.227 14.9119 21.189 15.1094 21.1134 15.2937C21.0379 15.478 20.9265 15.6454 20.7856 15.7862C20.6447 15.927 20.4771 16.0383 20.2928 16.1136C20.1084 16.1889 19.9108 16.2268 19.7117 16.225C19.5125 16.2231 19.3157 16.1817 19.1327 16.103C18.9498 16.0243 18.7843 15.9099 18.646 15.7666L17.636 14.7566C17.111 15.1162 16.5516 15.4227 15.966 15.6716L16.209 16.5776C16.3012 16.9582 16.2409 17.3597 16.041 17.6964C15.8411 18.0331 15.5175 18.2783 15.1393 18.3796C14.761 18.4809 14.3582 18.4303 14.0167 18.2386C13.6753 18.0469 13.4224 17.7293 13.312 17.3536L13.061 16.4186C12.356 16.4916 11.644 16.4916 10.939 16.4186L10.689 17.3536C10.5861 17.7379 10.3347 18.0656 9.99024 18.2645C9.64574 18.4635 9.2363 18.5175 8.852 18.4146C8.4677 18.3117 8.14002 18.0603 7.94105 17.7158C7.74207 17.3713 7.6881 16.9619 7.791 16.5776L8.033 15.6706C7.44777 15.4219 6.88869 15.1158 6.364 14.7566L5.354 15.7666C5.2157 15.9099 5.05023 16.0243 4.86727 16.103C4.6843 16.1817 4.48749 16.2231 4.28832 16.225C4.08915 16.2268 3.89162 16.1889 3.70724 16.1136C3.52286 16.0383 3.35533 15.927 3.21442 15.7862C3.07352 15.6454 2.96206 15.478 2.88655 15.2937C2.81104 15.1094 2.773 14.9119 2.77463 14.7127C2.77627 14.5135 2.81756 14.3167 2.89608 14.1336C2.97461 13.9506 3.0888 13.785 3.232 13.6466L4.192 12.6866C3.46223 11.7161 2.91344 10.6219 2.572 9.45659C2.52451 9.3089 2.50022 9.15473 2.5 8.99959Z" fill="#176CBF" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 9C11.2044 9 10.4413 9.31607 9.87868 9.87868C9.31607 10.4413 9 11.2044 9 12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12C15 11.2044 14.6839 10.4413 14.1213 9.87868C13.5587 9.31607 12.7956 9 12 9ZM12 17C10.6739 17 9.40215 16.4732 8.46447 15.5355C7.52678 14.5979 7 13.3261 7 12C7 10.6739 7.52678 9.40215 8.46447 8.46447C9.40215 7.52678 10.6739 7 12 7C13.3261 7 14.5979 7.52678 15.5355 8.46447C16.4732 9.40215 17 10.6739 17 12C17 13.3261 16.4732 14.5979 15.5355 15.5355C14.5979 16.4732 13.3261 17 12 17ZM12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z" fill="#ADADAD" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  {passwordMismatch && confirmPasswordBlurred && (
                    <>
                      <div className="lg:hidden mt-2 p-2 bg-blue-50 border border-blue-200 rounded-sm">
                        <p className="text-xs text-blue-600 font-medium">Passwords do not match.</p>
                      </div>
                      <div className="hidden lg:block mt-2 p-2 bg-blue-50 border border-blue-200 rounded-sm">
                        <p className="text-xs text-blue-600 font-medium">Passwords do not match.</p>
                      </div>
                    </>
                  )}
                </div>


                <button
                  type="submit"
                  disabled={loading || !formData.email || !formData.password || !formData.confirmPassword || emailError || passwordError || passwordMismatch || hasEmoji(formData.email) || hasEmoji(formData.password)}
                  className="w-full h-[2.4rem] lg:h-auto flex justify-center py-2 lg:py-3 px-4 border border-transparent rounded-md text-white btn-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-semibold text-sm lg:text-base disabled:opacity-60"
                >
                  {loading ? 'Sending OTP...' : 'Get Started'}
                </button>
                <div className="text-center mb-2">
                  <Link to="#" onClick={handleBackToStepOne} className="font-semibold text-blue-600 hover:text-blue-700 underline">
                    Back
                  </Link>
                </div>
              </form>
            ) : (
              <form className="space-y-3 lg:space-y-6" onSubmit={handleVerifyOtpAndRegister}>
                <div>
                  <label htmlFor="otp" className="block text-base lg:text-[1.25rem] font-medium text-default mb-1 lg:mb-2 text-left">
                    Enter otp {invalidOtp && <span className="text-red-500 font-normal">(Invalid otp)</span>}
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
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
                    className={`w-full px-3 lg:px-4 text-sm lg:text-base border-2 rounded-md ring-primary transition-colors bg-gray-50 placeholder-[#ADADAD] h-[2.2rem] lg:h-[2.75rem] max-w-[30.875rem] ${invalidOtp ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`}
                    placeholder="Enter otp"
                  />
                  <div className="text-right pt-5">
                    <a
                      href="#"
                      onClick={handleResendOtp}
                      className={`text-default underline font-medium ${loading || resendTimer > 0
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

                <button
                  type="submit"
                  disabled={loading || !otp || otp.length !== 6 || otpError}
                  className="w-full h-[2.4rem] lg:h-[2.75rem] flex justify-center pt-[0.4rem] lg:pt-[0.4rem] border border-transparent rounded-md text-white btn-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-inter text-base lg:text-[1.3rem] gap-[0.625rem] disabled:opacity-60"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
                <div className="text-center mb-2">
                  <a href="#" onClick={handleBackToStepOne} className="font-semibold text-blue-600 hover:text-blue-700 underline">
                    Back to signup
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
