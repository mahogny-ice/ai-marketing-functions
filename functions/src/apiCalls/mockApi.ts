export interface MockApiResponse {
    type: "mock"; // Ensure this matches your data
    time: string;
    output: string;
}

export async function triggerMockApi(timout: number = 1000): Promise<MockApiResponse> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({
                type: "mock",
                time: Date.now().toString(),
                output: 'https://firebasestorage.googleapis.com/v0/b/ai-marketing-e2b7e.appspot.com/o/TEST%2Ftrack2.m4a?alt=media&token=0a8f300b-81fb-404c-a135-0e9c1e8e728e'
            })
        }, timout);
    });
};