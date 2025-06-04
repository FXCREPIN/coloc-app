import { User } from "@/store/authStore";

// Simuler une base de données d'utilisateurs
let users: User[] = [];

// Simuler le stockage des mots de passe (dans une vraie application, ils seraient hachés)
const passwords: { [userId: string]: string } = {};

export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = users.find(u => u.username === username);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    
    // Dans une vraie application, vérifier le mot de passe avec bcrypt
    if (passwords[user.id] !== password) {
      throw new Error("Mot de passe incorrect");
    }
    
    return user;
  },
  
  register: async (username: string, email: string, password: string): Promise<User> => {
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Vérifier si l'utilisateur existe déjà
    if (users.some(u => u.username === username)) {
      throw new Error("Cet identifiant est déjà utilisé");
    }
    
    if (users.some(u => u.email === email)) {
      throw new Error("Cette adresse email est déjà utilisée");
    }
    
    // Créer un nouvel utilisateur
    const newUser: User = {
      id: String(users.length + 1),
      username,
      email,
    };
    
    users.push(newUser);
    passwords[newUser.id] = password;
    return newUser;
  },
  
  logout: async (): Promise<void> => {
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Dans une vraie application, vérifier le token JWT et retourner l'utilisateur
    return null;
  },

  updateUsername: async (userId: string, newUsername: string): Promise<User> => {
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 500));

    // Vérifier si le nouvel username est déjà utilisé
    if (users.some(u => u.username === newUsername && u.id !== userId)) {
      throw new Error("Cet identifiant est déjà utilisé");
    }

    // Mettre à jour l'utilisateur
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error("Utilisateur non trouvé");
    }

    users[userIndex] = { ...users[userIndex], username: newUsername };
    return users[userIndex];
  },

  updateEmail: async (userId: string, newEmail: string): Promise<User> => {
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 500));

    // Vérifier si le nouvel email est déjà utilisé
    if (users.some(u => u.email === newEmail && u.id !== userId)) {
      throw new Error("Cette adresse email est déjà utilisée");
    }

    // Mettre à jour l'utilisateur
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error("Utilisateur non trouvé");
    }

    users[userIndex] = { ...users[userIndex], email: newEmail };
    return users[userIndex];
  },

  updatePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 500));

    // Vérifier le mot de passe actuel
    if (passwords[userId] !== currentPassword) {
      throw new Error("Mot de passe actuel incorrect");
    }

    // Mettre à jour le mot de passe
    passwords[userId] = newPassword;
  },
}; 