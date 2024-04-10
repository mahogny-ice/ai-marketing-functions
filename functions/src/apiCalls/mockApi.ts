/**
 * This file is a mock API call that simulates an API call to a server.
 */
export interface MockApiResponse {
    type: "mock"; // Ensure this matches your data
    time: string;
    output: string;
}

/**
 * @param {number} timeout number of milliseconds to wait before resolving the promise
 * @return {Promise<MockApiResponse>} a promise that resolves with a MockApiResponse
 */
export async function triggerMockApi(timeout = 1000): Promise<MockApiResponse> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                type: "mock",
                time: Date.now().toString(),
                output: "https://firebasestorage.googleapis.com/v0/b/ai-marketing-e2b7e.appspot.com/o/TEST%2Ftrack2.m4a?alt=media&token=0a8f300b-81fb-404c-a135-0e9c1e8e728e",
            });
        }, timeout);
    });
}
