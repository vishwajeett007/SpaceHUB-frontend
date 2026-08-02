import { BASE_URL } from './client';
import { handleJson } from './response';

export async function registerUser(payload) {
  const response = await fetch(`${BASE_URL}registration`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function loginUser(payload) {
  const response = await fetch(`${BASE_URL}login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function requestForgotPassword(email) {
  const response = await fetch(`${BASE_URL}forgotpassword`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email })
  });
  return handleJson(response);
}

export async function validateOtp(payload) {
  const response = await fetch(`${BASE_URL}validateforgototp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function resetPassword(payload) {
  const response = await fetch(`${BASE_URL}resetpassword`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function resendRegisterOtp(email, registrationToken) {
  const response = await fetch(`${BASE_URL}resendotp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, sessionToken: registrationToken }),
  });
  return handleJson(response);
}

export async function resendForgotOtp(forgotToken) {
  const response = await fetch(`${BASE_URL}resendforgototp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken: forgotToken })
  });
  return handleJson(response);
}

export async function validateRegisterOtp(payload) {
  const response = await fetch(`${BASE_URL}validateregisterotp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}
