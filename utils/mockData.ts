import { User } from '../types';

export const generateUsers = (count: number): User[] => {
  const users: User[] = [
    // --- Known Contacts ---
    {
      id: 'user_haasika',
      name: 'Haasika',
      phoneNumber: '6303592901',
      upiId: '6303592901@payguard',
      avatar: 'https://ui-avatars.com/api/?name=Haasika&background=0D8ABC&color=fff',
      balance: 10000000,
    },
    {
      id: 'user_keerthi',
      name: 'Keerthi',
      phoneNumber: '7995247524',
      upiId: '7995247524@payguard',
      avatar: 'https://ui-avatars.com/api/?name=Keerthi&background=E91E63&color=fff',
      balance: 10000000,
    },
    {
      id: 'user_maha',
      name: 'Maha',
      phoneNumber: '9182159936',
      upiId: '9182159936@payguard',
      avatar: 'https://ui-avatars.com/api/?name=Maha&background=9C27B0&color=fff',
      balance: 10000000,
    },
    {
      id: 'user_manu',
      name: 'Manu',
      phoneNumber: '8309448163',
      upiId: '8309448163@payguard',
      avatar: 'https://ui-avatars.com/api/?name=Manu&background=673AB7&color=fff',
      balance: 10000000,
    },
    {
      id: 'user_yash',
      name: 'Yash',
      phoneNumber: '9177739626',
      upiId: '9177739626@payguard',
      avatar: 'https://ui-avatars.com/api/?name=Yash&background=3F51B5&color=fff',
      balance: 10000000,
    },

    // --- Unknown Numbers (Potential Risks) ---
    {
      id: 'unknown_siri',
      name: 'Siri', // Will be displayed as Unknown initially
      phoneNumber: '9390571188',
      upiId: '9390571188@otherbank',
      avatar: 'https://ui-avatars.com/api/?name=?',
      balance: 50000,
      isUnknown: true
    },
    {
      id: 'unknown_shruthi',
      name: 'Shruthi',
      phoneNumber: '6300845767',
      upiId: '6300845767@otherbank',
      avatar: 'https://ui-avatars.com/api/?name=?',
      balance: 50000,
      isUnknown: true
    },
    {
      id: 'unknown_spoorthi',
      name: 'Spoorthi',
      phoneNumber: '7095404836',
      upiId: '7095404836@otherbank',
      avatar: 'https://ui-avatars.com/api/?name=?',
      balance: 50000,
      isUnknown: true
    },
    {
      id: 'unknown_rakshitha',
      name: 'Rakshitha',
      phoneNumber: '7416078449',
      upiId: '7416078449@otherbank',
      avatar: 'https://ui-avatars.com/api/?name=?',
      balance: 50000,
      isUnknown: true
    },
    {
      id: 'unknown_akshaya',
      name: 'Akshaya',
      phoneNumber: '9951888989',
      upiId: '9951888989@otherbank',
      avatar: 'https://ui-avatars.com/api/?name=?',
      balance: 50000,
      isUnknown: true
    }
  ];

  return users;
};