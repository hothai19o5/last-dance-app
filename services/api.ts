// API Service - Central API client with JWT authentication
import { authService } from "./authService";

// API Base URL - Update this to your actual server URL
// const API_BASE_URL = 'https://hoxuanthai.id.vn/api/v1';
const API_BASE_URL = 'http://192.168.0.111:8080/api/v1';

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/login',
    REGISTER: '/register',

    // User
    USER_DETAIL: '/user/me',
    USER_UPDATE: '/user',
    USER_AVATAR: '/user/avatar',
    USER_PRESIGNED_URL: '/user/avatar/presigned-url', // New endpoint for presigned URL

    // Health Data
    HEALTH_DATA: '/sync/health-data',

    // Device registration
    DEVICE: '/device',
};

export interface ApiResponse<T> {
    status: string;
    message: string;
    data: T;
}

// Request/Response Types
export interface RegistrationRequest {
    firstName: string;
    lastName: string;
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
    waterIntakeMl?: number;         // Water intake in ml
    activityStatus?: number;        // 0=sleeping, 1=resting, 2=walking, 3=running
    sleepDurationMinutes?: number;  // Sleep duration in minutes
    alertScore?: number | null;     // ML alert score (0-1), null if not available
}

export interface HealthDataDto {
    deviceUuid: string;
    dataPoints: HealthDataPoint[];
}

export interface DeviceRegistrationRequest {
    deviceUuid: string;
    deviceName: string;
    username: string;
}

export interface UserDetailResponse {
    id?: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    gender?: 'MALE' | 'FEMALE';
    heightM?: number;
    age?: number;
    weightKg?: number;
    profilePictureUrl?: string;
    bmi?: number;
    enable?: boolean;
    dob?: string;
}

export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    gender?: 'MALE' | 'FEMALE';
    heightM?: number;
    weightKg?: number;
    dob?: string;
}

export interface AvatarUploadResponse {
    imageUrl: string;
}

export interface PresignedUrlResponse {
    presignedUrl: string;
    objectUrl: string;
    expiresIn: number;
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
                console.log('[API] Adding auth token to headers');
            } else {
                console.warn('[API] No auth token found for authenticated request');
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

            console.error('[API] Request failed:', {
                status: response.status,
                message: errorMessage,
                url: response.url,
            });

            const error: ApiError = {
                message: errorMessage,
                status: response.status,
            };

            // If unauthorized, clear token
            if (response.status === 401) {
                console.warn('[API] Unauthorized - clearing tokens');
                await authService.clearTokens();
            }

            throw error;
        }

        const text = await response.text();
        if (!text) {
            return {} as T;
        }

        try {
            const parsed = JSON.parse(text);
            console.log('[API] Response parsed successfully:', typeof parsed);
            return parsed;
        } catch {
            console.warn('[API] Response is not JSON, returning as text');
            return text as unknown as T;
        }
    }

    /**
     * Fetch with timeout
     */
    private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout after 10 seconds');
            }
            throw error;
        }
    }

    /**
     * Generic GET request
     */
    async get<T>(endpoint: string, requiresAuth: boolean = true): Promise<T> {
        const headers = await this.getHeaders(requiresAuth);
        const response = await this.fetchWithTimeout(this.getUrl(endpoint), {
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
        const response = await this.fetchWithTimeout(this.getUrl(endpoint), {
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
        const response = await this.fetchWithTimeout(this.getUrl(endpoint), {
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
        const response = await this.fetchWithTimeout(this.getUrl(endpoint), {
            method: 'DELETE',
            headers,
        });

        return this.handleResponse<T>(response);
    }

    /**
     * Generic PATCH request
     */
    async patch<T, R>(endpoint: string, data: T, requiresAuth: boolean = true): Promise<R> {
        const headers = await this.getHeaders(requiresAuth);
        const response = await this.fetchWithTimeout(this.getUrl(endpoint), {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });

        return this.handleResponse<R>(response);
    }

    /**
     * POST request with FormData (for file uploads)
     */
    async postFormData<R>(endpoint: string, formData: FormData, requiresAuth: boolean = true): Promise<R> {
        const headers: HeadersInit = {};
        // Don't set Content-Type for FormData - browser will set it with boundary

        if (requiresAuth) {
            const token = await authService.getAccessToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('[API] Adding auth token to FormData headers');
            } else {
                console.warn('[API] No auth token found for authenticated FormData request');
            }
        }

        const response = await this.fetchWithTimeout(this.getUrl(endpoint), {
            method: 'POST',
            headers,
            body: formData,
        });

        return this.handleResponse<R>(response);
    }

    /**
     * Register new user
     */
    async register(data: RegistrationRequest): Promise<ApiResponse<RegistrationResponse>> {
        console.log('[API] Registering user:', data.username);
        return this.post<RegistrationRequest, ApiResponse<RegistrationResponse>>(
            API_ENDPOINTS.REGISTER,
            data,
            false // No auth required for registration
        );
    }

    /**
     * Login user
     */
    async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
        console.log('[API] Logging in user:', data.username);
        const response = await this.post<LoginRequest, ApiResponse<LoginResponse>>(
            API_ENDPOINTS.LOGIN,
            data,
            false // No auth required for login
        );

        console.log('[API] Login response received:', { hasToken: !!response.data.token });

        // Save token after successful login
        if (response.data.token) {
            await authService.saveAccessToken(response.data.token);
            console.log('[API] Token saved successfully');

            // Verify token was saved
            const savedToken = await authService.getAccessToken();
            if (!savedToken) {
                console.error('[API] Token save verification failed!');
            } else {
                console.log('[API] Token save verified');
            }
        } else {
            console.warn('[API] No token in login response');
        }

        return response;
    }

    /**
     * Get current user details
     * @returns User detail response
     */
    async getUserDetail(): Promise<ApiResponse<UserDetailResponse>> {
        return this.get<ApiResponse<UserDetailResponse>>(API_ENDPOINTS.USER_DETAIL, true);
    }

    /**
     * Update user profile information
     * @param data - User data to update
     * @returns Updated user data
     */
    async updateUser(data: UpdateUserRequest): Promise<ApiResponse<UserDetailResponse>> {
        console.log('[API] Updating user profile:', data);
        return this.patch<UpdateUserRequest, ApiResponse<UserDetailResponse>>(
            API_ENDPOINTS.USER_UPDATE,
            data,
            true // Requires authentication
        );
    }

    /**
     * Get presigned URL for avatar upload
     * @param filename - Name of the file to upload
     * @returns Presigned URL (string)
     */
    async getPresignedUrl(filename: string): Promise<string> {
        console.log('[API] Requesting presigned URL for:', filename);
        // Backend uses POST method with query parameter
        const response = await this.post<null, ApiResponse<string>>(
            `${API_ENDPOINTS.USER_PRESIGNED_URL}?fileName=${encodeURIComponent(filename)}`,
            null, // No body needed, fileName is in query param
            true // Requires authentication
        );
        return response.data;
    }

    /**
     * Upload file to S3 using presigned URL
     * @param presignedUrl - Presigned URL from backend
     * @param fileUri - Local URI of the file to upload
     * @returns true if successful
     */
    async uploadToS3(presignedUrl: string, fileUri: string): Promise<boolean> {
        try {
            console.log('[API] Uploading to S3:', fileUri);

            // Read the file as blob
            const response = await fetch(fileUri);
            const blob = await response.blob();

            // Upload to S3 using PUT
            const uploadResponse = await fetch(presignedUrl, {
                method: 'PUT',
                body: blob,
                headers: {
                    'Content-Type': blob.type || 'image/jpeg',
                },
            });

            if (!uploadResponse.ok) {
                throw new Error(`S3 upload failed: ${uploadResponse.status}`);
            }

            console.log('[API] S3 upload successful');
            return true;
        } catch (error) {
            console.error('[API] S3 upload error:', error);
            throw error;
        }
    }

    /**
     * Upload user avatar using presigned URL flow
     * @param imageUri - Local URI of the image to upload
     * @returns URL of the uploaded avatar
     */
    async uploadAvatarWithPresignedUrl(imageUri: string): Promise<string> {
        try {
            console.log('[API] Starting presigned URL upload flow:', imageUri);

            // Extract filename from URI
            const uriParts = imageUri.split('/');
            const filename = uriParts[uriParts.length - 1] || 'avatar.jpg';

            // Step 1: Get presigned URL from backend (returns string directly)
            const presignedUrl = await this.getPresignedUrl(filename);
            console.log('[API] Received presigned URL');

            // Step 2: Upload to S3
            await this.uploadToS3(presignedUrl, imageUri);

            // Step 3: Extract object URL from presigned URL (remove query parameters)
            const objectUrl = presignedUrl.split('?')[0];
            console.log('[API] Avatar uploaded successfully:', objectUrl);
            return objectUrl;
        } catch (error) {
            console.error('[API] Presigned URL upload error:', error);
            throw error;
        }
    }

    /**
     * Upload user avatar (legacy method - will be deprecated)
     * @param imageUri - Local URI of the image to upload
     * @returns URL of the uploaded avatar
     */
    async uploadAvatar(imageUri: string): Promise<ApiResponse<string>> {
        console.log('[API] Uploading avatar:', imageUri);

        const formData = new FormData();

        // Get file extension and mime type
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1] || 'jpg';
        const mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;

        // Append the file to form data
        formData.append('file', {
            uri: imageUri,
            name: `avatar.${fileType}`,
            type: mimeType,
        } as any);

        return this.postFormData<ApiResponse<string>>(
            API_ENDPOINTS.USER_AVATAR,
            formData,
            true // Requires authentication
        );
    }

    /**
     * Send health data to server
     */
    async sendHealthData(data: HealthDataDto): Promise<ApiResponse<{ message: string }>> {
        console.log('[API] Sending health data:', data.dataPoints.length, 'points');
        return this.post<HealthDataDto, ApiResponse<{ message: string }>>(
            API_ENDPOINTS.HEALTH_DATA,
            data,
            true // Requires authentication
        );
    }

    /**
     * Register a device with the backend for the current user
     */
    async registerDevice(data: DeviceRegistrationRequest): Promise<ApiResponse<{ message?: string }>> {
        console.log('[API] Registering device on server:', data.deviceUuid);
        return this.post<DeviceRegistrationRequest, ApiResponse<{ message?: string }>>(
            API_ENDPOINTS.DEVICE,
            data,
            true // Requires authentication
        );
    }

    /**
     * Delete/unlink a device from the current user
     */
    async deleteDevice(deviceUuid: string): Promise<ApiResponse<{ message?: string }>> {
        console.log('[API] Deleting device from server:', deviceUuid);
        return this.delete<ApiResponse<{ message?: string }>>(
            `${API_ENDPOINTS.DEVICE}/${deviceUuid}`,
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
