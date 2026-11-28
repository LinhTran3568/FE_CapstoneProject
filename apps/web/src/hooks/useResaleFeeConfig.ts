import { useQuery } from '@tanstack/react-query';
import { resaleListingsApi, ResaleFeeConfigDto } from '@ticketshield/api-client';

export const calculateBuyerFee = (
  price: number,
  config?: ResaleFeeConfigDto | null
) => {
  if (!config) {
    return {
      buyerFee: 0,
      percentageFee: 0,
      isMinimumApplied: false,
      totalBuyerPaid: price,
      buyerPercentageFormatted: '0%',
    };
  }
  const percentageFee = Math.round(price * config.buyerFeePercentage);
  const isMinimumApplied = config.minimumBuyerFee > 0 && percentageFee < config.minimumBuyerFee;
  const buyerFee = isMinimumApplied ? config.minimumBuyerFee : percentageFee;
  return {
    buyerFee,
    percentageFee,
    isMinimumApplied,
    totalBuyerPaid: price + buyerFee,
    buyerPercentageFormatted: `${Number((config.buyerFeePercentage * 100).toFixed(2))}%`,
  };
};

export const calculateSellerFee = (
  price: number,
  config?: ResaleFeeConfigDto | null
) => {
  if (!config) {
    return {
      sellerFee: 0,
      percentageFee: 0,
      isMinimumApplied: false,
      netSellerPayout: price,
      sellerPercentageFormatted: '0%',
    };
  }
  const percentageFee = Math.round(price * config.sellerFeePercentage);
  const isMinimumApplied = config.minimumSellerFee > 0 && percentageFee < config.minimumSellerFee;
  const sellerFee = isMinimumApplied ? config.minimumSellerFee : percentageFee;
  return {
    sellerFee,
    percentageFee,
    isMinimumApplied,
    netSellerPayout: Math.max(0, price - sellerFee),
    sellerPercentageFormatted: `${Number((config.sellerFeePercentage * 100).toFixed(2))}%`,
  };
};

export const useResaleFeeConfig = () => {
  const query = useQuery<ResaleFeeConfigDto>({
    queryKey: ['resale-fee-config'],
    queryFn: async () => {
      return await resaleListingsApi.getFeePolicy();
    },
    staleTime: 30 * 1000, // 30s cache
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const config = query.data;

  const buyerFeePercent = config ? Number((config.buyerFeePercentage * 100).toFixed(2)) : 0;
  const sellerFeePercent = config ? Number((config.sellerFeePercentage * 100).toFixed(2)) : 0;

  return {
    ...query,
    config,
    buyerFeePercent,
    sellerFeePercent,
    minBuyerFee: config?.minimumBuyerFee ?? 0,
    minSellerFee: config?.minimumSellerFee ?? 0,
    calcBuyerFee: (price: number) => calculateBuyerFee(price, config),
    calcSellerFee: (price: number) => calculateSellerFee(price, config),
  };
};
