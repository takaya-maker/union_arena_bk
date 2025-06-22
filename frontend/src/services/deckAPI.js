import { API_BASE_URL } from '../config/config';

// デッキ関連のAPI呼び出し
export const fetchDecks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/decks`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching decks:', error);
    throw error;
  }
};

export const createDeck = async (deckData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/decks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deckData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating deck:', error);
    throw error;
  }
};

export const updateDeck = async (deckId, deckData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/decks/${deckId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deckData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating deck:', error);
    throw error;
  }
};

export const deleteDeck = async (deckId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/decks/${deckId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting deck:', error);
    throw error;
  }
};

export const getDeckById = async (deckId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/decks/${deckId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching deck:', error);
    throw error;
  }
}; 