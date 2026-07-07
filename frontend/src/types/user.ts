export type AdminUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUserDetails = {
  name: string;
  email: string;
  isAdmin: boolean;
};

export type UpdateUserInput = {
  name: string;
  email: string;
  isAdmin: boolean;
};
