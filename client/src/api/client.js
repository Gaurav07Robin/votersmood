import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('janmat_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const api = {
  // Auth API Endpoints (Communicates directly with Firebase DB on Server)
  login: (data) => apiClient.post('/auth/login', data).then(r => r.data),
  signup: (data) => apiClient.post('/auth/register', data).then(r => r.data),
  getMe: () => apiClient.get('/auth/me').then(r => r.data),
  getLocations: () => apiClient.get('/auth/locations').then(r => r.data),
  updateProfile: (data) => apiClient.put('/auth/profile', data).then(r => r.data),
  updateAvatar: (data) => apiClient.put('/auth/profile/avatar', data).then(r => r.data),

  // Official Election Polls & Live Signals (Synced with Cloud Firestore DB)
  getOfficialElections: (params) => apiClient.get('/polls/official', { params }).then(r => r.data),
  getOfficialElectionById: (id) => apiClient.get(`/polls/official/${id}`).then(r => r.data),
  getUserVotes: () => apiClient.get('/polls/user-votes').then(r => r.data),
  getPollingSignals: () => apiClient.get('/polls/signals').then(r => r.data),
  voteOfficialElection: (data) => apiClient.post('/polls/official/vote', data).then(r => r.data),
  createOfficialElection: (data) => apiClient.post('/polls/official', data).then(r => r.data),
  updateOfficialElection: (id, data) => apiClient.put(`/polls/official/${id}`, data).then(r => r.data),
  deleteOfficialElection: (id) => apiClient.delete(`/polls/official/${id}`).then(r => r.data),

  // Community Mini Issue Polls (User Surveys Below Official Poll)
  getCommunityPolls: () => apiClient.get('/polls/community').then(r => r.data),
  createCommunityPoll: (data) => apiClient.post('/polls/community', data).then(r => r.data),
  voteCommunityPoll: (id, data) => apiClient.post(`/polls/community/${id}/vote`, data).then(r => r.data),
  featureCommunityPoll: (id) => apiClient.put(`/polls/community/${id}/feature`).then(r => r.data),
  deleteCommunityPoll: (id) => apiClient.delete(`/polls/community/${id}`).then(r => r.data),

  // Posts & Discussions
  getPosts: (params) => apiClient.get('/posts', { params }).then(r => r.data),
  createPost: (data) => apiClient.post('/posts', data).then(r => r.data),
  deletePost: (id) => apiClient.delete(`/posts/${id}`).then(r => r.data),
  approvePost: (id, isApproved) => apiClient.put(`/posts/${id}/approve`, { isApproved }).then(r => r.data),

  // Comments
  getComments: (postId) => apiClient.get(`/comments?postId=${postId}`).then(r => r.data),
  createComment: (data) => apiClient.post('/comments', data).then(r => r.data),
  deleteComment: (id) => apiClient.delete(`/comments/${id}`).then(r => r.data),

  // Reactions
  toggleReaction: (data) => apiClient.post('/reactions', data).then(r => r.data),
  getUserReactions: () => apiClient.get('/reactions/user-reactions').then(r => r.data),

  // Leaders & Portfolios
  getLeaders: (params) => apiClient.get('/leaders', { params }).then(r => r.data),
  getLeaderById: (id) => apiClient.get(`/leaders/${id}`).then(r => r.data),
  createLeader: (data) => apiClient.post('/leaders', data).then(r => r.data),
  updateLeader: (id, data) => apiClient.put(`/leaders/${id}`, data).then(r => r.data),
  deleteLeader: (id) => apiClient.delete(`/leaders/${id}`).then(r => r.data),

  // Topics
  getTopics: (params) => apiClient.get('/topics', { params }).then(r => r.data),

  // Admin
  getAdminStats: () => apiClient.get('/admin/stats').then(r => r.data),
  getAppConfig: () => apiClient.get('/admin/config').then(r => r.data),
};

export default apiClient;
