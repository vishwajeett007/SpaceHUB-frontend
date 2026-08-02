import React, { useState, useRef, useEffect } from 'react';
import { loginUser, getProfileSummary } from '../../../shared/services/API';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import { normalizeAuthToken } from '../../../shared/services/authStorage';
import { showToast } from '../../../shared/services/toast';
import AuthSlides from '../components/AuthSlides';


const LoginPage = () => {
  const navigate = useNavigate();
  const { login, updateUser } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [identifierError, setIdentifierError] = useState(false);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [loading, setLoading] = useState(false);
  const throttleRefs = useRef({ login: 0 });

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
    try {
      const savedIdentifier = sessionStorage.getItem('lastIdentifier');
      if (savedIdentifier) {
        setIdentifier(savedIdentifier);
      }
    } catch (storageError) {
      console.warn('Unable to restore the last login identifier:', storageError);
    }
  }, []);

  const hasEmoji = (value) => /[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}]/u.test(value || '');
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !hasEmoji(value);

  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setInvalidCredentials(false);
    if (shouldThrottleAction('login', 2000, 'Please wait before trying again.')) {
      return;
    }
    setLoading(true);
    const emailLike = isValidEmail(identifier);
    if (!emailLike) {
      setIdentifierError(true);
      if (isMobile()) {
        showToast('Enter a valid email address.', 'error');
      }
      setLoading(false);
      return;
    }
    const identifierToSend = identifier.trim();
    loginUser({ identifier: identifierToSend, password })
      .then(async (data) => {
        console.log('Login successful');
        const resolvedUser = data?.user || data?.data?.user || {};
        const responseEmail = (data?.email || data?.data?.email) ? String(data?.email || data?.data?.email) : undefined;
        const effectiveEmail = resolvedUser?.email || responseEmail || (emailLike ? identifierToSend : undefined);
        const userWithId = { ...resolvedUser, email: effectiveEmail || resolvedUser?.email || responseEmail || '' };
        const token = normalizeAuthToken(
          data?.accessToken || data?.token || data?.jwt || data?.data?.accessToken || data?.data?.token
        );

        if (!token) {
          throw new Error('Login succeeded without an access token. Please try again.');
        }

        // Persist the valid token before loading the authenticated profile.
        login(userWithId, token);


        try {
          if (effectiveEmail) {
            const profileData = await getProfileSummary(effectiveEmail);
            if (profileData?.data?.profileImage) {
              userWithId.profileImage = profileData.data.profileImage;
              userWithId.avatarUrl = profileData.data.profileImage;
            }
            if (profileData?.data?.username) {
              userWithId.username = profileData.data.username;
            }
            updateUser(userWithId);
          }
        } catch (error) {
          console.error('Failed to fetch profile summary:', error);

        }

        const profileSetupRequired = localStorage.getItem('profileSetupRequired') === 'true';
        try {
          sessionStorage.setItem('lastIdentifier', identifierToSend);
          if (emailLike) {
            sessionStorage.setItem('lastEmail', identifierToSend);
          }
        } catch (storageError) {
          console.warn('Unable to remember the login identifier:', storageError);
        }
        showToast('Login successful!', 'success');
        if (profileSetupRequired) {
          navigate('/profile/setup', { replace: true });
        } else {
          navigate('/dashboard');
        }
      })
      .catch((err) => {
        console.error('Login failed:', err.message);
        const errorMessage = err.message || 'Login failed. Please try again.';
        if (err.message.includes('Invalid credentials')) {
          setInvalidCredentials(true);
        }
        showToast(errorMessage, 'error');
      })
      .finally(() => setLoading(false));
  };

  const handleIdentifierChange = (e) => {
    const value = e.target.value;
    setIdentifier(value);
    setInvalidCredentials(false);

    setIdentifierError(false);
  };

  const handlePasswordChange = (e) => {
    let value = e.target.value;
    // Filter out emojis from password
    value = value.replace(/[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}]/gu, '');
    setPassword(value);
    setInvalidCredentials(false);
  };

  return (
    <>
      <style>
        {`
          .password-input[type="password"]:not([data-show="true"]):not(:placeholder-shown) {
            -webkit-text-security: disc;
            text-security: disc;
            color: #3b82f6;
            font-size: 1.75rem;
            line-height: 1;
            letter-spacing: 0.1em;
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
      <div className="w-screen h-screen flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden lg:fixed lg:top-0 lg:left-0 overflow-hidden text-body bg-white">
        <AuthSlides />

        <div className="flex-1 flex items-center justify-center p-1 lg:p-12 bg-[#EEEEEE] lg:h-full lg:min-h-screen lg:overflow-y-auto lg:rounded-l-4xl rounded-t-[2.25rem] lg:rounded-tr-none sm:rounded-t-[2.25rem] lg:-ml-4 -mt-2 lg:mt-0 relative z-10 lg:shadow-lg shadow-lg overflow-y-auto">
          <div className="w-full max-w-[31rem] pb-1 mb-1 lg:pb-5 lg:mb-5">
            <div className="text-center mb-1 lg:mb-8">
              <div className="mx-auto h-12 w-12 lg:h-40 lg:w-40 flex items-center justify-center pt-1 lg:pt-10 ">
                <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
                  <img src="/favicon.png" alt="Logo" className="h-8 w-10 lg:h-15 lg:w-22" />
                </button>
              </div>
              <h3 className="text-lg lg:text-[1.75rem] font-semibold text-default mb-0.5 lg:mb-1">Login to your account</h3>
              <p className="text-muted text-xs lg:text-[1.25rem] font-normal">
                Welcome back, Please enter your details
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-1.5 lg:space-y-6">
              <div>
                <label htmlFor="identifier" className="flex items-center gap-2 text-base lg:text-[1.25rem] font-medium text-default mb-1 lg:mb-2 text-left">
                  Email address <p className='text-red-500 text-sm lg:text-md font-thin'>{invalidCredentials && '(Invalid credential)'}</p>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 7.53516V17.0002C22 17.7654 21.7077 18.5017 21.1827 19.0584C20.6578 19.6152 19.9399 19.9503 19.176 19.9952L19 20.0002H5C4.23479 20.0002 3.49849 19.7078 2.94174 19.1829C2.38499 18.6579 2.04989 17.9401 2.005 17.1762L2 17.0002V7.53516L11.445 13.8322L11.561 13.8982C11.6977 13.965 11.8478 13.9997 12 13.9997C12.1522 13.9997 12.3023 13.965 12.439 13.8982L12.555 13.8322L22 7.53516Z" fill="#ADADAD" />
                      <path d="M19 4C20.08 4 21.027 4.57 21.555 5.427L12 11.797L2.44501 5.427C2.6958 5.01982 3.0403 4.6785 3.44978 4.43149C3.85926 4.18448 4.32186 4.03894 4.79901 4.007L5.00001 4H19Z" fill="#ADADAD" />
                    </svg>
                  </div>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={handleIdentifierChange}
                    className={`w-full pl-10 pr-4 py-2 lg:py-3 text-sm lg:text-base border-2 rounded-md ring-primary  transition-colors bg-gray-50 placeholder-[#ADADAD] h-[2.2rem] lg:h-[2.75rem] max-w-[30.875rem] ${identifierError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`}
                    placeholder="Enter your email"
                  />
                </div>
                {identifierError && (
                  <p className="hidden lg:block mt-1 text-sm text-red-500">
                    Enter a valid email address.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="flex items-center gap-2 text-base lg:text-[1.25rem] font-medium text-default mb-1 lg:mb-2 text-left">
                  Enter Password
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
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    data-show={showPassword}
                    className={`password-input w-full pl-10 pr-12 py-2 lg:py-3 text-sm lg:text-base border-2 rounded-md ring-primary transition-colors bg-gray-50 placeholder-[#ADADAD] h-[2.2rem] lg:h-[2.75rem] max-w-[30.875rem] border-gray-300 focus:border-blue-500`}
                    placeholder="Enter your password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('Eye button clicked, current showPassword:', showPassword);
                        setShowPassword(!showPassword);
                      }}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
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
                </div>
              </div>
              <div className="flex items-center justify-end mb-4">
                <div className="text-sm mb-2">
                  <Link to="/forgot-password" className="text-default underline hover:text-blue-700 font-medium ">
                    Forget password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !identifier || !password || identifierError}
                className="w-full h-[2.4rem] lg:h-auto flex justify-center py-2 lg:py-3 px-4 border border-transparent rounded-md text-white btn-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-semibold text-sm lg:text-base disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="text-center">
                <p className="text-sm text-black">
                  Not have any account?{' '}
                  <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700 underline">
                    Signup
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
