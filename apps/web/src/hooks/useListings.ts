import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsApi } from '@ticketshield/api-client';
import { CreateListingFormData } from '@ticketshield/validation';

export const useListings = (filters?: {
  eventId?: string;
  verifiedOnly?: boolean;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest';
}) => {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => listingsApi.getAll(filters),
  });
};

export const useListingDetail = (id: string) => {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListingFormData) => listingsApi.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
};
