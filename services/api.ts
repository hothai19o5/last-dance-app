// API Service - Central API client with JWT authentication
import { authService } from "./authService";

// API Base URL - Update this to your actual server URL
const API_BASE_URL = 'http://192.168.0.104:8080/api/v1';

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/login',
    REGISTER: '/register',

    // Health Data
    HEALTH_DATA: '/healthdata',
};

// Request/Response Types
export interface RegistrationRequest {
    name: string;
    email: string;
    username: string;
    password: string;
}

export interface RegistrationResponse {
    message: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
}

export interface HealthDataPoint {
    timestamp: string;
    heartRate: number;
    spo2: number;
    stepCount: number;
    caloriesBurned: number;
}

export interface HealthDataDto {
    deviceUuid: string;
    dataPoints: HealthDataPoint[];
}

export interface ApiError {
    message: string;
    status?: number;
}

class ApiService {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Build full URL from endpoint
     */
    private getUrl(endpoint: string): string {
        return `${this.baseUrl}${endpoint}`;
    }

    /**
     * Get headers with JWT token if available
     */
    private async getHeaders(includeAuth: boolean = true): Promise<HeadersInit> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = await authService.getAccessToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    /**
     * Handle API response
     */
    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = errorJson.message || errorMessage;
            } catch {
                // If not JSON, use the text as error message
                if (errorBody) {
                    errorMessage = errorBody;
                }
            }

            const error: ApiError = {
                message: errorMessage,
                status: response.status,
            };

            // If unauthorized, clear token
            if (response.status === 401) {
                await authService.clearTokens();
            }

            throw error;
        }

        const text = await response.text();
        if (!text) {
            return {} as T;
        }

        try {
            return JSON.parse(text);
        } catch {
            return text as unknown as T;
        }
    }

    /**
     * Generic GET request
     */
    async get<T>(endpoint: string, requiresAuth: boolean = true): Promise<T> {
        const headers = await this.getHeaders(requiresAuth);
        const response = await fetch(this.getUrl(endpoint), {
            method: 'GET',
            headers,
        });

        return this.handleResponse<T>(response);
    }

    /**
     * Generic POST request
     */
    async post<T, R>(endpoint: string, data: T, requiresAuth: boolean = true): Promise<R> {
        const headers = await this.getHeaders(requiresAuth);
        const response = await fetch(this.getUrl(endpoint), {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });

        return this.handleResponse<R>(response);
    }

    /**
     * Generic PUT request
     */
    async put<T, R>(endpoint: string, data: T, requiresAuth: boolean = true): Promise<R> {
        const headers = await this.getHeaders(requiresAuth);
        const response = await fetch(this.getUrl(endpoint), {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });

        return this.handleResponse<R>(response);
    }

    /**
     * Generic DELETE request
     */
    async delete<T>(endpoint: string, requiresAuth: boolean = true): Promise<T> {
        const headers = await this.getHeaders(requiresAuth);
        const response = await fetch(this.getUrl(endpoint), {
            method: 'DELETE',
            headers,
        });

        return this.handleResponse<T>(response);
    }

    // ==================== Auth APIs ====================

    /**
     * Register new user
     */
    async register(data: RegistrationRequest): Promise<RegistrationResponse> {
        console.log('[API] Registering user:', data.username);
        return this.post<RegistrationRequest, RegistrationResponse>(
            API_ENDPOINTS.REGISTER,
            data,
            false // No auth required for registration
        );
    }

    /**
     * Login user
     */
    async login(data: LoginRequest): Promise<LoginResponse> {
        console.log('[API] Logging in user:', data.username);
        const response = await this.post<LoginRequest, LoginResponse>(
            API_ENDPOINTS.LOGIN,
            data,
            false // No auth required for login
        );

        // Save token after successful login
        if (response.token) {
            await authService.saveAccessToken(response.token);
            console.log('[API] Token saved successfully');
        }

        return response;
    }

    // ==================== Health Data APIs ====================

    /**
     * Send health data to server
     */
    async sendHealthData(data: HealthDataDto): Promise<{ message: string }> {
        console.log('[API] Sending health data:', data.dataPoints.length, 'points');
        return this.post<HealthDataDto, { message: string }>(
            API_ENDPOINTS.HEALTH_DATA,
            data,
            true // Requires authentication
        );
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        const token = await authService.getAccessToken();
        return token !== null;
    }
}

// Export singleton instance
export const apiService = new ApiService();
