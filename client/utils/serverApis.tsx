import { SERVER_URL } from './constants';

export const updateStageAtDB = async (stageNum : Number) => {
    try {
        const response = await fetch(`${SERVER_URL}/users/stage/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ stage: stageNum })
        });

        if (!response.ok) {
            console.error('Failed to update stage on server');
        }
    } catch (error) {
        console.error('Error updating stage:', error);
    }
}