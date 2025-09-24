// Authentication API Service

import Cookies from 'js-cookie';

const API_BASE = 'https://api.getmediarank.com/api/v1/auth';

// Save token to cookies
export function setToken(token) {
  if (typeof window !== 'undefined') {
    // Set cookie for 7 days (or adjust as needed)
    Cookies.set('access_token', token, { expires: 7, sameSite: 'strict' });
  }
}

// Save user ID to cookies
export function setUserId(userId) {
  if (typeof window !== 'undefined') {
    Cookies.set('user_id', userId, { expires: 7, sameSite: 'strict' });
  }
}

// Get user ID from cookies
export function getUserId() {
  if (typeof window === 'undefined') return null;
  return Cookies.get('user_id');
}

// Get current user info from API
export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await response.json();
    // Store user ID in cookies
    setUserId(userData.id);
    return userData;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

// Get token from cookies and check expiration
export function getToken() {
  if (typeof window === 'undefined') return null;
  const token = Cookies.get('access_token');
  if (!token) return null;
  // Check expiration (JWT exp)
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      // Token expired
      logout();
      return null;
    }
  } catch {
    // If parsing fails, treat as invalid/expired
    logout();
    return null;
  }
  return token;
}

// Remove token from cookies
export function logout() {
  if (typeof window !== 'undefined') {
    Cookies.remove('access_token');
  }
}

// Login function
export async function login(email, password) {
  const params = new URLSearchParams();
  params.append('email', email);
  params.append('password', password);

  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  setToken(data.access_token);
  
  // Get and store user info
  try {
    const userData = await getCurrentUser();
    if (userData) {
      setUserId(userData.id);
    }
  } catch (error) {
    console.error('Error fetching user info after login:', error);
  }
  
  return data;
}

// Register lawyer function
export async function registerLawyer(email, password, fullName) {
  const response = await fetch(`${API_BASE}/register/lawyer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      email, 
      password, 
      full_name: fullName 
    }),
  });

  if (!response.ok) {
    throw new Error('Lawyer registration failed');
  }

  const data = await response.json();
  setToken(data.access_token);
  
  // Get and store user info
  try {
    const userData = await getCurrentUser();
    if (userData) {
      setUserId(userData.id);
    }
  } catch (error) {
    console.error('Error fetching user info after registration:', error);
  }
  
  return data;
}

// Register client function
export async function registerClient(email, password, fullName) {
  const response = await fetch(`${API_BASE}/register/client`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      email, 
      password, 
      full_name: fullName 
    }),
  });

  if (!response.ok) {
    throw new Error('Client registration failed');
  }

  const data = await response.json();
  setToken(data.access_token);
  
  // Get and store user info
  try {
    const userData = await getCurrentUser();
    if (userData) {
      setUserId(userData.id);
    }
  } catch (error) {
    console.error('Error fetching user info after registration:', error);
  }
  
  return data;
}

// Legacy register function for backward compatibility
export async function register(username, password) {
  return registerLawyer(username, password, '');
} 