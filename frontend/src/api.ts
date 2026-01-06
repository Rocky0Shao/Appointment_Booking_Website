import axios from 'axios';

// 1. Point to your Django Server
const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface TimeBlock {
    id: string;
    start: string; // ISO String from Django
    end: string;
    title: string;
    type: 'booking' | 'blocked';
}

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
        await axios.delete(`${API_BASE_URL}/time-blocks/${id}/`);
        return true;
    } catch (error) {
        console.error("Failed to delete block:", error);
        return false;
    }
};