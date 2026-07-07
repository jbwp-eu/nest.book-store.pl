export interface SeedUser {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

const users = (adminPassword: string): SeedUser[] => [
  {
    name: 'admin',
    email: 'admin@test.pl',
    password: adminPassword,
    isAdmin: true,
  },
];

export default users;
