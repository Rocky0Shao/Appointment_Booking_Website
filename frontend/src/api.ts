import axios from 'axios';
// Forcing a redeploy to pick up env varss
// 1. Point to your Django Server
// const API_BASE_URL = 'http://127.0.0.1:8000/api';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
console.log("API URL being used:", API_BASE_URL);
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Token ${token}` } : {};
};

export interface TimeBlock {
    id: string;
    start: string;
    end: string;
    title: string;
    type: 'booking' | 'blocked';
    // Add optional fields (because Red blocks won't have them)
    guest_name?: string;  
    guest_email?: string; 
}
export const loginUser = async (username: string, password: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login/`, { username, password });
        
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            
            // 🟢 NEW: Save the slug too!
            // If slug is missing (null), save an empty string to avoid crashes
            localStorage.setItem('slug', response.data.slug || ''); 
            
            return true;
        }
        return false;
    } catch (error) {
        console.error("Login failed:", error);
        return false;
    }
};
// 2. The Fetch Function
export const getAvailability = async (slug: string, start: string, end: string) => {
    try {
        // This matches the URL we just tested in the browser
        const response = await axios.get<TimeBlock[]>(`${API_BASE_URL}/availability/${slug}/`, {
            params: { start, end }
        });
        return response.data;
    } catch (error) {
        console.error("API Error:", error);
        return [];
    }
};

export const deleteTimeBlock = async (id: string) => {
    try {
        await axios.delete(`${API_BASE_URL}/time-blocks/${id}/`, {
            headers: getAuthHeaders() // <--- Attach the Key Card!
        });
        return true;
    } catch (error) {
        console.error("Failed to delete block:", error);
        return false;
    }
};

// ... existing code ...

export const createTimeBlock = async (slug: string, start: string, end: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/time-blocks/create/`, {
            slug,
            start,
            end
        }, {
            headers: getAuthHeaders() // <--- Attach the Key Card!
        });
        return response.data;
    } catch (error) {
        console.error("Failed to create block:", error);
        return null;
    }
};

// frontend/src/api.ts

export const createBooking = async (slug: string, start: string, end: string, name: string, email: string) => {
    try {
        await axios.post(`${API_BASE_URL}/bookings/create/`, {
            slug,
            start,
            end,
            name,
            email
        });
        return true;
    } catch (error) {
        console.error("Booking failed:", error);
        return false;
    }
};